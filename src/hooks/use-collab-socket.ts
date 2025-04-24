import { useEffect, useRef, useState, useCallback } from "react";
import { Socket, io as socketIo } from "socket.io-client";
import { GrapesJSEventSchema, LockEventSchema, PresenceEventSchema } from "@/lib/zod/grapesjs-events";

const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FED766', // Yellow
  '#2AB7CA', // Cyan
  '#F0B8B8', // Pink
  '#8A9A5B', // Moss Green
  '#B28DFF', // Purple
];

const getColorForUser = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

export interface CollabUser {
  id: string;
  name: string;
  color?: string;
}

export interface Lock {
  elementId: string;
  user: CollabUser;
}

export function useCollabSocket({ projectId, token }: { projectId: string; token: string }) {
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [locks, setLocks] = useState<Record<string, CollabUser>>({});
  const [isConnected, setIsConnected] = useState(false); // Track connection status
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    function connect() {
      const io = socketIo;
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000", {
        path: "/socket.io/collab",
        auth: { token },
        query: { projectId },
        reconnection: true,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;
      setIsConnected(true); // Set connected status

      // --- Presence ---
      socket.on("presence-update", (payload: unknown) => {
        const parsed = PresenceEventSchema.safeParse(payload);
        if (parsed.success) {
          const usersWithColors = parsed.data.map((user) => ({
            ...user,
            color: getColorForUser(user.id),
          }));
          setUsers(usersWithColors);
        }
      });
      // --- Locks ---
      socket.on("lock", (payload: unknown) => {
        const parsed = LockEventSchema.safeParse(payload);
        if (parsed.success) {
          setLocks(prev => ({ ...prev, [parsed.data.elementId]: parsed.data.user }));
        }
      });
      socket.on("unlock", (payload: unknown) => {
        const parsed = LockEventSchema.safeParse(payload);
        if (parsed.success) {
          setLocks(prev => {
            const copy = { ...prev };
            delete copy[parsed.data.elementId];
            return copy;
          });
        }
      });
      // --- Reconexión: limpiar locks si se pierde conexión ---
      socket.on("disconnect", () => {
        setLocks({});
      });
    }
    connect();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [projectId, token]);

  // --- Emitir eventos ---
  const emitLock = useCallback((elementId: string) => {
    socketRef.current?.emit("lock", { elementId });
  }, [socketRef]);
  const emitUnlock = useCallback((elementId: string) => {
    socketRef.current?.emit("unlock", { elementId });
  }, [socketRef]);
  const emitGrapesEvent = useCallback((event: unknown) => {
    if (GrapesJSEventSchema.safeParse(event).success) {
      socketRef.current?.emit("grapesjs-event", event);
    }
  }, [socketRef]);

  // --- Eventos remotos ---
  const onGrapesEvent = useCallback((handler: (event: unknown) => void) => {
    socketRef.current?.on("grapesjs-event", handler);
    return () => socketRef.current?.off("grapesjs-event", handler);
  }, [socketRef]);

  return {
    users,
    locks,
    emitLock,
    emitUnlock,
    emitGrapesEvent,
    onGrapesEvent,
    isConnected,
  };
}
