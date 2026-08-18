"use client";

import type { MediaProvider, RemoteStream, ConnectionQuality } from "@/types/media";
import { RTC_CONFIG, QUALITY_THRESHOLDS } from "@/types/media";
import type { DarkoSocket } from "@/hooks/use-socket";

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream | null;
  quality: ConnectionQuality;
}

/**
 * Full-mesh WebRTC provider.
 *
 * Each peer pair maintains one RTCPeerConnection. Signaling (offer/answer/ICE)
 * is relayed through the Socket.IO server.
 *
 * Topology:
 *   - N participants = N-1 peer connections per client
 *   - Each client sends its audio+video tracks to all others
 *   - Screen share is added as an additional video track (one-way)
 *
 * Limitations (documented honestly):
 *   - Browser CPU + uplink grow O(n²) — caps at ~6 voice/video participants
 *   - No simulcast — all viewers receive the same quality
 *   - No dominant speaker indication (computed client-side only)
 *
 * For larger rooms, swap with LiveKitSFUProvider (interface-compatible).
 */
export class MeshMediaProvider implements MediaProvider {
  readonly type = "mesh" as const;

  private localStream: MediaStream | null = null;
  private socket: DarkoSocket | null = null;
  private peers = new Map<string, PeerConnection>();
  private screenStream: MediaStream | null = null;
  private selfId: string | null = null;

  private remoteStreamCallbacks: ((s: RemoteStream) => void)[] = [];
  private remoteStreamRemovedCallbacks: ((peerId: string) => void)[] = [];
  private qualityCallbacks: ((peerId: string, q: ConnectionQuality) => void)[] = [];
  private peerConnectedCallbacks: ((peerId: string) => void)[] = [];
  private peerDisconnectedCallbacks: ((peerId: string) => void)[] = [];

  private qualityCheckInterval: ReturnType<typeof setInterval> | null = null;

  initialize(localStream: MediaStream, socket: DarkoSocket): void {
    this.localStream = localStream;
    this.socket = socket;


    // Register signaling handlers directly on the socket.
    // These persist for the lifetime of the socket object.
    this.socket.on("webrtc:offer", (payload) => {
      this._handleOffer(payload.fromUserId, payload.sdp);
    });
    this.socket.on("webrtc:answer", (payload) => {
      this._handleAnswer(payload.fromUserId, payload.sdp);
    });
    this.socket.on("webrtc:ice", (payload) => {
      this._handleRemoteIce(payload.fromUserId, payload.candidate);
    });

    // Start quality monitoring
    this.qualityCheckInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, 5000);
  }

  // Public wrappers for external callers (kept for API compatibility)
  async handleOffer(fromUserId: string, sdp: string): Promise<void> {
    return this._handleOffer(fromUserId, sdp);
  }
  async handleAnswer(fromUserId: string, sdp: string): Promise<void> {
    return this._handleAnswer(fromUserId, sdp);
  }
  async handleRemoteIce(fromUserId: string, candidate: string): Promise<void> {
    return this._handleRemoteIce(fromUserId, candidate);
  }

  /**
   * Set the self user ID (called from the hook after room:join ack).
   */
  setSelfId(id: string): void {
    this.selfId = id;
  }


  /**
   * Connect to a new peer.
   * Creates the RTCPeerConnection and adds local tracks.
   * The onnegotiationneeded event will trigger offer creation automatically
   * (only on the initiator side — the peer with the smaller user ID).
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (!this.localStream || !this.socket) return;
    if (this.peers.has(peerId)) return;


    const pc = new RTCPeerConnection(RTC_CONFIG);
    const peerConn: PeerConnection = {
      pc,
      remoteStream: null,
      quality: "good",
    };
    this.peers.set(peerId, peerConn);

    this.setupPeerConnectionHandlers(peerId, pc);

    // Add local tracks — this triggers onnegotiationneeded
    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    // Add screen share track if active
    if (this.screenStream) {
      for (const track of this.screenStream.getVideoTracks()) {
        pc.addTrack(track, this.screenStream);
      }
    }
  }

  private async createAndSendOffer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer || !this.socket) return;

    try {
      // Don't use offerToReceiveAudio/Video — we add tracks manually.
      // Modern browsers infer receive directions from added transceivers.
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);

      this.socket.emit(
        "webrtc:offer",
        { targetUserId: peerId, sdp: offer.sdp! },
        (res) => {
          if (!res.ok) {
            console.error(`[webrtc] offer to ${peerId} failed:`, res.error);
          }
        }
      );
    } catch (err) {
      console.error(`[webrtc] createOffer error for ${peerId}:`, err);
    }
  }

  private async _handleOffer(fromUserId: string, sdp: string): Promise<void> {
    if (!this.socket || !this.localStream) return;


    let peer = this.peers.get(fromUserId);
    if (!peer) {
      // New peer — create connection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peer = {
        pc,
        remoteStream: null,
        quality: "good",
      };
      this.peers.set(fromUserId, peer);
      this.setupPeerConnectionHandlers(fromUserId, pc);

      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
      if (this.screenStream) {
        for (const track of this.screenStream.getVideoTracks()) {
          pc.addTrack(track, this.screenStream);
        }
      }
    }

    try {
      await peer.pc.setRemoteDescription({ type: "offer", sdp });
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);

      this.socket.emit(
        "webrtc:answer",
        { targetUserId: fromUserId, sdp: answer.sdp! },
        (res) => {
          if (!res.ok) {
            console.error(`[webrtc] answer to ${fromUserId} failed:`, res.error);
          }
        }
      );
    } catch (err) {
      console.error(`[webrtc] handleOffer error from ${fromUserId}:`, err);
    }
  }

  private async _handleAnswer(fromUserId: string, sdp: string): Promise<void> {
    const peer = this.peers.get(fromUserId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription({ type: "answer", sdp });
    } catch (err) {
      console.error(`[webrtc] handleAnswer error from ${fromUserId}:`, err);
    }
  }

  private async _handleRemoteIce(fromUserId: string, candidate: string): Promise<void> {
    const peer = this.peers.get(fromUserId);
    if (!peer) return;

    try {
      await peer.pc.addIceCandidate(JSON.parse(candidate));
    } catch (err) {
    }
  }

  private setupPeerConnectionHandlers(peerId: string, pc: RTCPeerConnection): void {
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit(
          "webrtc:ice",
          {
            targetUserId: peerId,
            candidate: JSON.stringify(event.candidate.toJSON()),
          },
          () => {}
        );
      }
    };

    pc.ontrack = (event) => {
      const peer = this.peers.get(peerId);
      if (!peer) return;

      if (!peer.remoteStream) {
        peer.remoteStream = new MediaStream();
      }
      peer.remoteStream.addTrack(event.track);

      const videoTracks = peer.remoteStream.getVideoTracks();
      const isScreenShare =
        videoTracks.length > 1 &&
        event.track.kind === "video" &&
        event.track === videoTracks[videoTracks.length - 1];

      const remoteStream: RemoteStream = {
        peerId,
        stream: peer.remoteStream,
        audioEnabled: true,
        videoEnabled: true,
        isScreenShare,
        quality: peer.quality,
      };

      this.remoteStreamCallbacks.forEach((cb) => cb(remoteStream));
      this.peerConnectedCallbacks.forEach((cb) => cb(peerId));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      if (state === "failed" || state === "closed") {
        this.qualityCallbacks.forEach((cb) => cb(peerId, "failed"));
        this.peerDisconnectedCallbacks.forEach((cb) => cb(peerId));
      } else if (state === "disconnected") {
        this.qualityCallbacks.forEach((cb) => cb(peerId, "poor"));
        this.restartIce(peerId);
      } else if (state === "connected") {
        this.qualityCallbacks.forEach((cb) => cb(peerId, "good"));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        this.restartIce(peerId);
      }
    };

    pc.onnegotiationneeded = async () => {
      // Only the initiator (smaller user ID) should create offers.
      // This prevents glare (both sides offering simultaneously).
      if (!this.selfId || this.selfId >= peerId) {
        return;
      }

      const peerForOffer = this.peers.get(peerId);
      if (!peerForOffer || !this.socket) return;

      try {
        const offer = await peerForOffer.pc.createOffer();
        await peerForOffer.pc.setLocalDescription(offer);
        this.socket.emit(
          "webrtc:offer",
          { targetUserId: peerId, sdp: offer.sdp! },
          () => {}
        );
      } catch (err) {
        console.error(`[webrtc] negotiationneeded offer error for ${peerId}:`, err);
      }
    };
  }

  private async restartIce(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer || !this.socket) return;

    try {
      const offer = await peer.pc.createOffer({ iceRestart: true });
      await peer.pc.setLocalDescription(offer);
      this.socket.emit(
        "webrtc:offer",
        { targetUserId: peerId, sdp: offer.sdp! },
        () => {}
      );
    } catch (err) {
      console.error(`[webrtc] ICE restart failed for ${peerId}:`, err);
    }
  }

  disconnectPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.pc.close();
    this.peers.delete(peerId);

    this.remoteStreamRemovedCallbacks.forEach((cb) => cb(peerId));
    this.peerDisconnectedCallbacks.forEach((cb) => cb(peerId));
  }

  updateLocalStream(newStream: MediaStream): void {
    const oldStream = this.localStream;
    this.localStream = newStream;

    for (const [, peer] of this.peers) {
      const senders = peer.pc.getSenders();

      const audioSender = senders.find((s) => s.track?.kind === "audio");
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (audioSender && newAudioTrack) {
        audioSender.replaceTrack(newAudioTrack).catch(console.error);
      }

      const videoSender = senders.find(
        (s) =>
          s.track?.kind === "video" &&
          s.track !== this.screenStream?.getVideoTracks()[0]
      );
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (videoSender && newVideoTrack) {
        videoSender.replaceTrack(newVideoTrack).catch(console.error);
      }
    }

    if (oldStream) {
      oldStream.getTracks().forEach((t) => {
        if (!newStream.getTracks().includes(t)) t.stop();
      });
    }
  }

  toggleTrack(kind: "audio" | "video", enabled: boolean): void {
    if (!this.localStream) return;
    const tracks =
      kind === "audio"
        ? this.localStream.getAudioTracks()
        : this.localStream.getVideoTracks();
    tracks.forEach((t) => {
      t.enabled = enabled;
    });
  }

  async startScreenShare(): Promise<MediaStream> {
    if (!this.localStream || !this.socket) throw new Error("Not initialized");

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true,
    });

    this.screenStream = screenStream;

    const screenTrack = screenStream.getVideoTracks()[0];
    if (screenTrack) {
      for (const [, peer] of this.peers) {
        peer.pc.addTrack(screenTrack, screenStream);
      }
    }

    screenTrack.onended = () => {
      this.stopScreenShare();
    };

    this.socket.emit("screen:share", { isSharing: true }, () => {});

    return screenStream;
  }

  stopScreenShare(): void {
    if (!this.screenStream || !this.socket) return;

    this.screenStream.getTracks().forEach((t) => t.stop());

    for (const [, peer] of this.peers) {
      const senders = peer.pc.getSenders();
      const screenSender = senders.find(
        (s) => s.track && this.screenStream!.getTracks().includes(s.track)
      );
      if (screenSender) {
        peer.pc.removeTrack(screenSender);
      }
    }

    this.screenStream = null;
    this.socket.emit("screen:share", { isSharing: false }, () => {});
  }

  private checkConnectionQuality(): void {
    for (const [peerId, peer] of this.peers) {
      peer.pc.getStats().then((stats) => {
        let packetLoss = 0;
        let rtt = 0;
        let hasInbound = false;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            hasInbound = true;
            const packetsReceived = report.packetsReceived ?? 0;
            const packetsLost = report.packetsLost ?? 0;
            const totalPackets = packetsReceived + packetsLost;
            if (totalPackets > 0) {
              packetLoss = packetsLost / totalPackets;
            }
            rtt =
              report.jitterBufferDelay && report.jitterBufferEmittedCount
                ? (report.jitterBufferDelay / report.jitterBufferEmittedCount) * 1000
                : 0;
          }
        });

        let quality: ConnectionQuality = "good";
        if (
          hasInbound &&
          (packetLoss > QUALITY_THRESHOLDS.GOOD.packetLoss ||
            rtt > QUALITY_THRESHOLDS.GOOD.rtt)
        ) {
          quality = "poor";
        }

        if (quality !== peer.quality) {
          peer.quality = quality;
          this.qualityCallbacks.forEach((cb) => cb(peerId, quality));
        }
      }).catch(() => {});
    }
  }

  onRemoteStream(cb: (s: RemoteStream) => void): void {
    this.remoteStreamCallbacks.push(cb);
  }

  onRemoteStreamRemoved(cb: (peerId: string) => void): void {
    this.remoteStreamRemovedCallbacks.push(cb);
  }

  onConnectionQuality(cb: (peerId: string, q: ConnectionQuality) => void): void {
    this.qualityCallbacks.push(cb);
  }

  onPeerConnected(cb: (peerId: string) => void): void {
    this.peerConnectedCallbacks.push(cb);
  }

  onPeerDisconnected(cb: (peerId: string) => void): void {
    this.peerDisconnectedCallbacks.push(cb);
  }

  destroy(): void {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }

    for (const [, peer] of this.peers) {
      peer.pc.close();
    }
    this.peers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    this.remoteStreamCallbacks = [];
    this.remoteStreamRemovedCallbacks = [];
    this.qualityCallbacks = [];
    this.peerConnectedCallbacks = [];
    this.peerDisconnectedCallbacks = [];
  }
}
