/**
 * DARKO WebRTC types and MediaProvider abstraction.
 *
 * The MediaProvider interface allows swapping the underlying media topology
 * (mesh vs SFU) without rewriting the room layer.
 *
 * Current: MeshMediaProvider — full mesh P2P, ≤6 participants.
 * Future:  LiveKitSFUProvider — drop-in replacement for larger rooms.
 */

export type ConnectionQuality = "good" | "poor" | "failed";

export interface RemoteStream {
  peerId: string;
  stream: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenShare: boolean;
  quality: ConnectionQuality;
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface MediaProvider {
  readonly type: "mesh" | "sfu";

  /**
   * Initialize the provider with the local media stream and socket.
   * Called once when the user joins the room.
   */
  initialize(localStream: MediaStream, socket: any): void;

  /**
   * Connect to a new peer (called when a new participant joins).
   */
  connectToPeer(peerId: string): Promise<void>;

  /**
   * Disconnect from a peer (called when a participant leaves).
   */
  disconnectPeer(peerId: string): void;

  /**
   * Update the local stream (e.g., mute/unmute, device switch).
   * Sends updated tracks to all connected peers via replaceTrack.
   */
  updateLocalStream(newStream: MediaStream): void;

  /**
   * Toggle a specific track (audio/video) without renegotiation.
   */
  toggleTrack(kind: "audio" | "video", enabled: boolean): void;

  /**
   * Start sharing the screen. Returns the screen stream.
   * The provider adds it to all peer connections as a one-way video track.
   */
  startScreenShare(): Promise<MediaStream>;

  /**
   * Stop sharing the screen.
   */
  stopScreenShare(): void;

  /**
   * Register callbacks for remote stream events.
   */
  onRemoteStream(cb: (stream: RemoteStream) => void): void;
  onRemoteStreamRemoved(cb: (peerId: string) => void): void;
  onConnectionQuality(cb: (peerId: string, quality: ConnectionQuality) => void): void;
  onPeerConnected(cb: (peerId: string) => void): void;
  onPeerDisconnected(cb: (peerId: string) => void): void;

  /**
   * Cleanup all connections.
   */
  destroy(): void;
}

// WebRTC config
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Connection quality thresholds
export const QUALITY_THRESHOLDS = {
  GOOD: { packetLoss: 0.03, rtt: 200, bitrate: 500_000 },
  POOR: { packetLoss: 0.1, rtt: 500, bitrate: 100_000 },
} as const;
