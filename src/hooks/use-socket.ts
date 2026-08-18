"use client";

import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/events";

type DarkoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  roomToken: string | null;
  onState?: (state: import("@/types/events").RoomStatePayload) => void;
  onPresenceUpdate?: (payload: import("@/types/events").PresenceUpdatePayload) => void;
  onUserJoined?: (payload: import("@/types/events").PresenceUserJoinedPayload) => void;
  onUserLeft?: (payload: import("@/types/events").PresenceUserLeftPayload) => void;
  onChatMessage?: (msg: import("@/types/events").ChatMessageBroadcast) => void;
  onChatDelete?: (payload: import("@/types/events").ChatDeleteBroadcast) => void;
  onChatReaction?: (payload: import("@/types/events").ChatReactionBroadcast) => void;
  onTyping?: (payload: import("@/types/events").TypingBroadcast) => void;
  onRoleUpdate?: (payload: import("@/types/events").RoleUpdateBroadcast) => void;
  onSettingsUpdate?: (payload: import("@/types/events").SettingsUpdateBroadcast) => void;
  onError?: (message: string, code?: string) => void;
}

interface UseSocketReturn {
  socket: DarkoSocket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnect: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

/**
 * Build the socket connection config.
 *
 * Production (NEXT_PUBLIC_SOCKET_URL is set):
 *   - Connect directly to the realtime server URL
 *   - path: "/" (Caddy-style routing not needed)
 *
 * Sandbox dev (NEXT_PUBLIC_SOCKET_URL is empty):
 *   - Connect to same origin as the page
 *   - Pass XTransformPort=3003 as a query param so Caddy routes to port 3003
 */
function getSocketConfig() {
  if (SOCKET_URL) {
    return { url: SOCKET_URL, path: "/" };
  }
  // Sandbox: same origin, Caddy routes via query param
  return { url: "/", path: "/", query: { XTransformPort: "3003" } };
}

/**
 * Hook for managing the Socket.IO connection to the DARKO realtime server.
 *
 * In production: NEXT_PUBLIC_SOCKET_URL points to the deployed realtime server.
 * In sandbox dev: empty string + XTransformPort=3003 query param routes through Caddy.
 */
export function useSocket(options: UseSocketOptions): UseSocketReturn {
  const [socket, setSocket] = useState<DarkoSocket | null>(null);
  const socketRef = useRef<DarkoSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs so we don't recreate the socket on every render
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

  const connect = useCallback(() => {
    if (socketRef.current) return;

    if (!options.roomToken) {
      setError("No room token");
      return;
    }

    setConnecting(true);
    setError(null);

    const config = getSocketConfig();
    const socket = io(config.url, {
      path: config.path,
      query: "query" in config ? config.query : undefined,
      auth: { token: options.roomToken },
      // Allow both transports — polling helps with proxies/Caddy, websocket is preferred
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    }) as DarkoSocket;

    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      setConnecting(false);
      setError(null);

      // Emit room:join with ack
      socket.emit("room:join", { roomToken: options.roomToken! }, (res) => {
        if (!res.ok) {
          setError(res.error ?? "Failed to join room");
          callbacksRef.current.onError?.(res.error ?? "Failed to join room", res.code);
        } else if (res.data) {
          callbacksRef.current.onState?.(res.data);
        }
      });
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") {
        // Server kicked us — don't auto-reconnect
        setError("Disconnected by server");
      }
    });

    socket.on("connect_error", (err) => {
      setConnecting(false);
      setError(err.message);
    });

    // Server event handlers
    socket.on("room:error", (payload) => {
      callbacksRef.current.onError?.(payload.message, payload.code);
    });

    socket.on("presence:update", (payload) => {
      callbacksRef.current.onPresenceUpdate?.(payload);
    });

    socket.on("presence:user_joined", (payload) => {
      callbacksRef.current.onUserJoined?.(payload);
    });

    socket.on("presence:user_left", (payload) => {
      callbacksRef.current.onUserLeft?.(payload);
    });

    socket.on("chat:message", (msg) => {
      callbacksRef.current.onChatMessage?.(msg);
    });

    socket.on("chat:delete", (payload) => {
      callbacksRef.current.onChatDelete?.(payload);
    });

    socket.on("chat:reaction", (payload) => {
      callbacksRef.current.onChatReaction?.(payload);
    });

    socket.on("chat:typing", (payload) => {
      callbacksRef.current.onTyping?.(payload);
    });

    socket.on("role:update", (payload) => {
      callbacksRef.current.onRoleUpdate?.(payload);
    });

    socket.on("settings:update", (payload) => {
      callbacksRef.current.onSettingsUpdate?.(payload);
    });
  }, [options.roomToken]);

  useEffect(() => {
    // Connecting on mount is a side effect, not a derived state update
    // eslint-disable-next-line react-hooks/set-state-in-effect
    connect();

    // Heartbeat — send every 30s
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("room:heartbeat", () => {});
      }
    }, 30_000);

    return () => {
      clearInterval(heartbeatInterval);
      if (socketRef.current) {
        socketRef.current.emit("room:leave", () => {});
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    connect();
  }, [connect]);

  return {
    socket,
    connected,
    connecting,
    error,
    reconnect,
  };
}
