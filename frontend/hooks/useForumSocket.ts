"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wsUrl, type ChatMessage } from "@/lib/chat";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "closed";

export interface ForumSocketHandlers {
  onMessage: (msg: ChatMessage, clientId?: string) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onReaction: (msg: ChatMessage) => void;
  onPresence: (online: number[]) => void;
  onTyping: (userId: number, fullName: string, isTyping: boolean) => void;
  onError: (detail: string, clientId?: string) => void;
  /** Fired after a reconnect so the page can re-fetch any missed messages. */
  onReconnected: () => void;
}

export interface ForumSocketApi {
  status: SocketStatus;
  sendMessage: (
    clientId: string,
    content: string,
    replyToId?: number,
    attachmentIds?: number[],
  ) => boolean;
  editMessage: (id: number, content: string) => boolean;
  deleteMessage: (id: number) => boolean;
  reactMessage: (messageId: number, emoji: string) => boolean;
  sendTyping: (isTyping: boolean) => void;
  sendRead: (lastReadMessageId: number) => void;
}

const MAX_BACKOFF = 15000;

export function useForumSocket(
  forumId: number | null,
  token: string | null,
  handlers: ForumSocketHandlers,
): ForumSocketApi {
  const [status, setStatus] = useState<SocketStatus>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  const attemptsRef = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);
  const hadConnection = useRef(false);

  // Keep latest handlers without forcing a reconnect when they change identity.
  handlersRef.current = handlers;

  const send = useCallback((payload: object): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (forumId === null || !token) return;
    closedByUs.current = false;

    function connect() {
      setStatus(attemptsRef.current === 0 ? "connecting" : "reconnecting");
      const ws = new WebSocket(wsUrl(forumId as number, token as string));
      wsRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        setStatus("open");
        if (hadConnection.current) handlersRef.current.onReconnected();
        hadConnection.current = true;
      };

      ws.onmessage = (ev) => {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(ev.data);
        } catch {
          return;
        }
        const h = handlersRef.current;
        switch (data.type) {
          case "message":
            h.onMessage(data.message as ChatMessage, data.client_id as string | undefined);
            break;
          case "edit":
            h.onEdit(data.message as ChatMessage);
            break;
          case "delete":
            h.onDelete(data.message as ChatMessage);
            break;
          case "reaction":
            h.onReaction(data.message as ChatMessage);
            break;
          case "presence":
            h.onPresence((data.online as number[]) ?? []);
            break;
          case "typing":
            h.onTyping(data.user_id as number, data.full_name as string, !!data.is_typing);
            break;
          case "error":
            h.onError((data.detail as string) ?? "Error", data.client_id as string | undefined);
            break;
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUs.current) {
          setStatus("closed");
          return;
        }
        // Exponential backoff with jitter.
        const delay = Math.min(1000 * 2 ** attemptsRef.current, MAX_BACKOFF);
        attemptsRef.current += 1;
        setStatus("reconnecting");
        reconnectTimer.current = setTimeout(connect, delay + Math.random() * 400);
      };

      ws.onerror = () => {
        // onclose will follow and handle reconnect.
        ws.close();
      };
    }

    connect();

    return () => {
      closedByUs.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [forumId, token]);

  const sendMessage = useCallback(
    (clientId: string, content: string, replyToId?: number, attachmentIds?: number[]) =>
      send({
        type: "message",
        client_id: clientId,
        content,
        reply_to_id: replyToId ?? null,
        attachment_ids: attachmentIds ?? [],
      }),
    [send],
  );
  const editMessage = useCallback(
    (id: number, content: string) => send({ type: "edit", id, content }),
    [send],
  );
  const deleteMessage = useCallback((id: number) => send({ type: "delete", id }), [send]);
  const reactMessage = useCallback(
    (messageId: number, emoji: string) => send({ type: "react", message_id: messageId, emoji }),
    [send],
  );
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      send({ type: "typing", is_typing: isTyping });
    },
    [send],
  );
  const sendRead = useCallback(
    (lastReadMessageId: number) => {
      send({ type: "read", last_read_message_id: lastReadMessageId });
    },
    [send],
  );

  return { status, sendMessage, editMessage, deleteMessage, reactMessage, sendTyping, sendRead };
}
