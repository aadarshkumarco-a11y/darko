"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Reply, Trash2, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useRoomStore } from "@/stores/room-store";
import { useChatStore } from "@/stores/chat-store";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, ChatMessageBroadcast } from "@/types/events";
import type { DarkoSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  socket: DarkoSocket | null;
  className?: string;
  compact?: boolean;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "😮", "😢", "👏"];

export function ChatPanel({ socket, className, compact }: ChatPanelProps) {
  const messages = useRoomStore((s) => s.messages);
  const self = useRoomStore((s) => s.self);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const draftMessage = useChatStore((s) => s.draftMessage);
  const setDraft = useChatStore((s) => s.setDraft);

  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom on new message (only if user is near bottom)
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Detect scroll position
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  // Periodic cleanup of stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      useChatStore.getState().cleanupTyping();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter typing users (exclude self)
  const activeTypingUsers = useMemo(
    () => typingUsers.filter((u) => u.userId !== self?.id),
    [typingUsers, self?.id]
  );

  const handleSend = async () => {
    if (!draftMessage.trim() || !socket) return;
    setSending(true);
    const content = draftMessage.trim();
    setDraft("");

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("chat:typing", { isTyping: false }, () => {});

    socket.emit(
      "chat:message",
      { content, replyToId: replyTo?.messageId },
      (res) => {
        setSending(false);
        if (!res.ok) {
          toast.error(res.error ?? "Failed to send message");
          // Restore draft so user can retry
          setDraft(content);
        } else {
          setReplyTo(null);
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);

    // Send typing indicator (debounced)
    if (!socket) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      socket.emit("chat:typing", { isTyping: true }, () => {});
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing", { isTyping: false }, () => {});
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleDelete = (messageId: string) => {
    if (!socket) return;
    socket.emit("chat:delete", { messageId }, (res) => {
      if (!res.ok) {
        toast.error(res.error ?? "Failed to delete message");
      }
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit("chat:reaction", { messageId, emoji }, (res) => {
      if (!res.ok) {
        toast.error(res.error ?? "Failed to add reaction");
      }
    });
  };

  return (
    <div className={cn("flex flex-col h-full surface-floating rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h3 className="font-display text-sm font-semibold text-white">Chat</h3>
        <span className="text-xs text-muted">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted text-sm">
            <Smile className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === self?.id}
              canModerate={self?.role === "OWNER" || self?.role === "HOST" || self?.role === "MODERATOR"}
              onReply={() => setReplyTo({ messageId: msg.id, senderName: msg.senderName })}
              onDelete={() => handleDelete(msg.id)}
              onReaction={(emoji) => handleReaction(msg.id, emoji)}
              compact={compact}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <div className="px-4 py-1 h-6 flex items-center">
        {activeTypingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted italic flex items-center gap-1.5"
          >
            <span className="flex gap-0.5">
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="inline-block"
              >
                ·
              </motion.span>
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                className="inline-block"
              >
                ·
              </motion.span>
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                className="inline-block"
              >
                ·
              </motion.span>
            </span>
            {activeTypingUsers.length === 1
              ? `${activeTypingUsers[0].displayName} is typing`
              : `${activeTypingUsers.length} people are typing`}
          </motion.div>
        )}
      </div>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t border-border-subtle bg-elevated/50 flex items-center gap-2"
          >
            <Reply className="h-3.5 w-3.5 text-muted" />
            <span className="text-xs text-secondary flex-1">
              Replying to <span className="text-white font-medium">{replyTo.senderName}</span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 rounded text-muted hover:text-white hover:bg-hover transition-colors"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draftMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 h-10 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            disabled={!socket?.connected}
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            isLoading={sending}
            disabled={!draftMessage.trim() || !socket?.connected}
            aria-label="Send message"
          >
            {!sending && <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted">{draftMessage.length}/2000</span>
          {!socket?.connected && (
            <span className="text-[10px] text-red-400">Reconnecting...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessageItem({
  message,
  isSelf,
  canModerate,
  onReply,
  onDelete,
  onReaction,
  compact,
}: {
  message: ChatMessageBroadcast;
  isSelf: boolean;
  canModerate: boolean;
  onReply: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  compact?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-muted italic">
        <div className="flex-1" />
        <span>message deleted</span>
        <div className="flex-1" />
      </div>
    );
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Generate a deterministic color from senderId
  const hue = message.senderId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const avatarBg = `hsl(${hue}, 50%, 35%)`;
  const initials = message.senderName.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex gap-2", isSelf && "flex-row-reverse")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {!compact && (
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
          style={{ background: avatarBg }}
        >
          {initials}
        </div>
      )}

      <div className={cn("flex-1 min-w-0", isSelf && "flex flex-col items-end")}>
        {/* Sender + time */}
        <div className={cn("flex items-center gap-2 mb-0.5", isSelf && "flex-row-reverse")}>
          <span className="text-xs font-medium text-white">{isSelf ? "You" : message.senderName}</span>
          <span className="text-[10px] text-muted">{time}</span>
          {message.senderRole === "OWNER" && (
            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 uppercase">Owner</span>
          )}
          {message.senderRole === "HOST" && (
            <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-400 uppercase">Host</span>
          )}
        </div>

        {/* Reply context */}
        {message.replyToSenderName && (
          <div className={cn("text-[10px] text-muted mb-0.5 italic", isSelf && "text-right")}>
            ↳ replying to {message.replyToSenderName}
          </div>
        )}

        {/* Message bubble */}
        <div className={cn("relative inline-block max-w-[85%]")}>
          <div
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm break-words",
              isSelf
                ? "bg-primary text-white rounded-br-sm"
                : "bg-overlay text-white border border-border-subtle rounded-bl-sm"
            )}
          >
            {message.content}
          </div>

          {/* Actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "absolute -top-8 flex items-center gap-0.5 bg-overlay border border-border-strong rounded-md p-0.5 shadow-lg z-10",
                isSelf ? "right-0" : "left-0"
              )}
            >
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 rounded hover:bg-hover text-muted hover:text-white transition-colors"
                aria-label="Add reaction"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onReply}
                className="p-1.5 rounded hover:bg-hover text-muted hover:text-white transition-colors"
                aria-label="Reply"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
              {(isSelf || canModerate) && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded hover:bg-hover text-muted hover:text-red-400 transition-colors"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "absolute -bottom-10 flex items-center gap-1 bg-overlay border border-border-strong rounded-md p-1 shadow-lg z-20",
                isSelf ? "right-0" : "left-0"
              )}
            >
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="p-1 rounded hover:bg-hover text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
