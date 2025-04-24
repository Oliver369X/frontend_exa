"use client";

/**
 * Custom hook for Socket.IO management
 * 
 * This hook provides a reusable way to connect to and interact with WebSocket connections
 * using Socket.IO. It handles connection, disconnection, event listening, and message sending.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Define event types for better type safety
export type SocketEvent = 
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'reconnect'
  | 'user-join'
  | 'user-leave'
  | 'presence-update'
  | 'editor:change'
  | 'chat:message'
  | string;

// Define the return type of our hook
export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: (projectId: string) => void;
  disconnect: () => void;
  emit: <T = any>(event: SocketEvent, data?: T) => void;
  on: <T = any>(event: SocketEvent, callback: (data: T) => void) => void;
  off: (event: SocketEvent) => void;
}

/**
 * Custom hook for managing Socket.IO connections
 * @returns Socket management functions and state
 */
export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Connect to the socket server
   * REQUIERE projectId para el handshake inicial del middleware
   * @param projectId - The project ID to connect to
   */
  const connect = useCallback((projectId: string) => {
    console.log(`[useSocket] connect function called for projectId: ${projectId}. Status:`, { isConnecting: isConnecting, hasSocket: !!socketRef.current });

    if (isConnecting || socketRef.current) {
      console.log('[useSocket] connect aborted: already connecting or connected.');
      return;
    }
    
    if (!session?.backendToken) { 
      console.warn('[useSocket] connect aborted: backendToken not available.');
      setError(new Error('Authentication backendToken not available'));
      return;
    }
    
    if (!projectId) {
         console.warn('[useSocket] connect aborted: projectId is missing.');
         setError(new Error('Project ID is required to connect'));
         return;
    }

    try {
      console.log('[useSocket] Attempting to connect...');
      setIsConnecting(true);
      setError(null);

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
      const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io/collab';
      
      console.log('[useSocket] Config:', { wsUrl, socketPath, projectId });

      const socket = io(wsUrl, {
        path: socketPath,
        auth: { token: session.backendToken }, 
        query: { projectId },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'], 
      });

      socket.on('connect', () => {
        console.log('[useSocket] Event: connect - Socket connected successfully!', { socketId: socket.id });
        setIsConnected(true);
        setIsConnecting(false);
      });

      socket.on('connect_error', (err) => {
        console.error('[useSocket] Event: connect_error - Socket connection error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
      });

      socket.on('disconnect', (reason) => {
        console.log('[useSocket] Event: disconnect - Socket disconnected:', reason);
        setIsConnected(false);
        socketRef.current = null;
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('[useSocket] Error initializing socket:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [session?.backendToken, isConnecting]);

  /**
   * Disconnect from the socket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Emit an event to the socket server
   * @param event - The event name
   * @param data - The data to send
   */
  const emit = useCallback(<T = any>(event: SocketEvent, data?: T) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  }, [isConnected]);

  /**
   * Listen for an event from the socket server
   * @param event - The event name
   * @param callback - The callback function
   */
  const on = useCallback(<T = any>(event: SocketEvent, callback: (data: T) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  /**
   * Stop listening for an event from the socket server
   * @param event - The event name
   */
  const off = useCallback((event: SocketEvent) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  // Clean up socket connection when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

export default useSocket;
