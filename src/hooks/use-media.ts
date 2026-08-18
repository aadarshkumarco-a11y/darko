"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MediaDevice } from "@/types/media";

interface UseMediaOptions {
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
}

interface UseMediaReturn {
  localStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDevices: MediaDevice[];
  videoDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
  error: string | null;
  requesting: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setAudioInput: (deviceId: string) => Promise<void>;
  setVideoInput: (deviceId: string) => Promise<void>;
  requestPermissions: () => Promise<void>;
  releaseStream: () => void;
}

/**
 * Hook for managing local media (microphone + camera).
 *
 * Handles:
 *   - getUserMedia permission request
 *   - Device enumeration + devicechange listener
 *   - Mute/unmute (track.enabled, no renegotiation)
 *   - Device switching (replaceTrack, no renegotiation for same codec)
 */
export function useMedia(options: UseMediaOptions = {}): UseMediaReturn {
  const { initialAudioEnabled = false, initialVideoEnabled = false } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled);
  const [videoEnabled, setVideoEnabled] = useState(initialVideoEnabled);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string | null>(null);
  const [selectedVideoInputId, setSelectedVideoInputId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices (requires permission to get labels)
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs: MediaDevice[] = [];
      const videoInputs: MediaDevice[] = [];
      const audioOutputs: MediaDevice[] = [];

      for (const d of devices) {
        const device: MediaDevice = {
          deviceId: d.deviceId,
          label: d.label || `${d.kind} ${d.deviceId.slice(0, 4)}`,
          kind: d.kind,
        };
        if (d.kind === "audioinput") audioInputs.push(device);
        else if (d.kind === "videoinput") videoInputs.push(device);
        else if (d.kind === "audiooutput") audioOutputs.push(device);
      }

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      setAudioOutputDevices(audioOutputs);

      // Auto-select first device if none selected
      if (!selectedAudioInputId && audioInputs[0]) {
        setSelectedAudioInputId(audioInputs[0].deviceId);
      }
      if (!selectedVideoInputId && videoInputs[0]) {
        setSelectedVideoInputId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error("[useMedia] enumerateDevices error:", err);
    }
  }, [selectedAudioInputId, selectedVideoInputId]);

  // Listen for device changes (plug/unplug headphones, etc.)
  useEffect(() => {
    const handler = () => enumerateDevices();
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handler);
    };
  }, [enumerateDevices]);

  const requestPermissions = useCallback(async () => {
    setRequesting(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedAudioInputId
          ? { deviceId: { exact: selectedAudioInputId } }
          : true,
        video: selectedVideoInputId
          ? { deviceId: { exact: selectedVideoInputId } }
          : { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Apply initial enabled state
      stream.getAudioTracks().forEach((t) => (t.enabled = initialAudioEnabled));
      stream.getVideoTracks().forEach((t) => (t.enabled = initialVideoEnabled));

      // Stop old stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = stream;
      setLocalStream(stream);

      // Now we have permission — re-enumerate to get device labels
      await enumerateDevices();
    } catch (err: any) {
      console.error("[useMedia] getUserMedia error:", err);
      if (err.name === "NotAllowedError") {
        setError("Microphone/camera permission denied. Please allow access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone or camera found. Please connect a device.");
      } else if (err.name === "NotReadableError") {
        setError("Your camera/microphone is being used by another app. Close it and try again.");
      } else {
        setError(err.message ?? "Failed to access media devices");
      }
    } finally {
      setRequesting(false);
    }
  }, [selectedAudioInputId, selectedVideoInputId, initialAudioEnabled, initialVideoEnabled, enumerateDevices]);

  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return;
    const newEnabled = !audioEnabled;
    streamRef.current.getAudioTracks().forEach((t) => (t.enabled = newEnabled));
    setAudioEnabled(newEnabled);
  }, [audioEnabled]);

  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;
    const newEnabled = !videoEnabled;
    streamRef.current.getVideoTracks().forEach((t) => (t.enabled = newEnabled));
    setVideoEnabled(newEnabled);
  }, [videoEnabled]);

  const setAudioInput = useCallback(async (deviceId: string) => {
    setSelectedAudioInputId(deviceId);
    if (!streamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack) {
        newAudioTrack.enabled = audioEnabled;
        // Replace track in the existing stream
        const oldAudioTrack = streamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) {
          streamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        streamRef.current.addTrack(newAudioTrack);
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
      }
    } catch (err) {
      console.error("[useMedia] setAudioInput error:", err);
    }
  }, [audioEnabled]);

  const setVideoInput = useCallback(async (deviceId: string) => {
    setSelectedVideoInputId(deviceId);
    if (!streamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: deviceId } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        newVideoTrack.enabled = videoEnabled;
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        streamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
      }
    } catch (err) {
      console.error("[useMedia] setVideoInput error:", err);
    }
  }, [videoEnabled]);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    localStream,
    audioEnabled,
    videoEnabled,
    audioDevices,
    videoDevices,
    audioOutputDevices,
    selectedAudioInputId,
    selectedVideoInputId,
    error,
    requesting,
    toggleAudio,
    toggleVideo,
    setAudioInput,
    setVideoInput,
    requestPermissions,
    releaseStream,
  };
}
