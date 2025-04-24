"use client";

/**
 * Socket Provider Component
 * 
 * This component provides socket connection functionality to the entire application
 * using React Context. It manages socket connections, authentication, and provides
 * a clean API for components to interact with WebSockets.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import useSocket, { SocketEvent, UseSocketReturn } from './use-socket';

// Define the context shape
interface SocketContextProps extends UseSocketReturn {
  activeUsers: { id: string; name: string }[];
  joinProject: (projectId: string) => void;
  leaveProject: () => void;
  sendMessage: (message: string) => void;
  currentProjectId: string | null;
}

// Create context with default values
const SocketContext = createContext<SocketContextProps | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket Provider Component
 * 
 * Wraps the application with socket connection functionality
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string }[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false); // Estado para evitar joins múltiples
  
  const socket = useSocket(); 
  
  // --- NUEVO: useEffect para emitir user-join DESPUÉS de conectar --- 
  useEffect(() => {
      // Si nos acabamos de conectar Y estábamos intentando unirnos a un proyecto
      if (socket.isConnected && isJoining && currentProjectId) {
          console.log(`[SocketProvider] Connection established while trying to join ${currentProjectId}. Emitting user-join.`);
          socket.emit('user-join'); // El servidor obtiene datos del token/handshake
          setIsJoining(false); // Reseteamos el flag de join
          toast.success('Joined project room');
      }
      // Si perdemos conexión mientras estábamos unidos, reseteamos
      else if (!socket.isConnected && currentProjectId) {
          console.log('[SocketProvider] Lost connection while in a project room.');
          setCurrentProjectId(null);
          setActiveUsers([]);
          setIsJoining(false);
      }
  }, [socket.isConnected, isJoining, currentProjectId, socket.emit]);

  // Set up event listeners cuando el socket conecte
  useEffect(() => {
    if (socket.isConnected) {
      console.log('[SocketProvider] Socket is connected, setting up global listeners.');
      socket.on<{ id: string; name: string }[]>('presence-update', (users) => {
        console.log('[SocketProvider] Received presence-update:', users);
        setActiveUsers(users);
      });
      
      socket.on<string>('error', (errorMessage) => {
        console.error('[SocketProvider] Received socket error event:', errorMessage);
        toast.error(`Socket error: ${errorMessage}`);
      });
      
      socket.on<{ userId: string; userName: string; message: string }>('chat:message', (data) => {
        console.log('[SocketProvider] Received chat:message:', data);
        toast.info(`${data.userName}: ${data.message}`);
      });
      
      // -- Listener para deltas del editor (MOVIDO a client-panel) --
      // No escuchar 'editor:delta-update' aquí, se hace en el panel específico

    } else {
        console.log('[SocketProvider] Socket not connected, cannot set up global listeners yet.');
    }

    return () => {
      if (socket.socket) {
        console.log('[SocketProvider] Cleaning up global listeners.');
        socket.off('presence-update');
        socket.off('error');
        socket.off('chat:message');
      }
    };
  }, [socket.isConnected, socket.on, socket.off, socket.socket]);

  // --- Definir leaveProject ANTES que joinProject --- 
  /**
   * Leave the current project collaboration session
   */
  const leaveProject = useCallback(() => {
    console.log(`[SocketProvider] leaveProject called. Current project: ${currentProjectId}, Connected: ${socket.isConnected}`);
    if (socket.isConnected && currentProjectId) {
       console.log('[SocketProvider] Emitting user-leave event...');
      socket.emit('user-leave'); // Servidor obtiene datos del socket
      
      // Limpiar estado local
      setCurrentProjectId(null); 
      setActiveUsers([]);
      setIsJoining(false); // Asegurarse de resetear si se sale
      
      // Considerar desconectar vs solo salir de la sala
      // socket.disconnect(); 
    } else {
         console.warn('[SocketProvider] Cannot emit user-leave: Socket not connected or no current project.');
    }
  }, [socket.isConnected, socket.emit, currentProjectId]);

  /**
   * Join a project collaboration session
   * Intenta conectar si es necesario, luego espera a que useEffect emita user-join
   * @param projectId - The project ID to join
   */
  const joinProject = useCallback((projectId: string) => {
    console.log(`[SocketProvider] joinProject called for projectId: ${projectId}. Status:`, { connected: socket.isConnected, connecting: socket.isConnecting });
    
    if (!session?.user?.id || !session?.backendToken) {
      toast.error('Cannot join project: User or token not available');
      console.warn('[SocketProvider] joinProject aborted: User or token missing.');
      return;
    }
    
    if (currentProjectId === projectId && socket.isConnected) {
        console.log('[SocketProvider] Already in this project room.');
        return;
    }

    // Ahora sí podemos llamar a leaveProject porque está definida antes
    if (currentProjectId && currentProjectId !== projectId && socket.isConnected) {
        console.log('[SocketProvider] Leaving previous project room first...');
        leaveProject(); 
    }

    setIsJoining(true);
    setCurrentProjectId(projectId); 

    if (!socket.isConnected && !socket.isConnecting) {
      console.log('[SocketProvider] Socket not connected, calling socket.connect()...');
      socket.connect(projectId); 
    } 
    else if (socket.isConnected) {
         console.log('[SocketProvider] Socket already connected. useEffect will handle user-join.');
    } else {
        console.log('[SocketProvider] Socket is currently connecting. useEffect will handle user-join.');
    }

  }, [
      socket.isConnected, 
      socket.isConnecting, 
      socket.connect, 
      session?.user?.id, 
      session?.backendToken, 
      currentProjectId, 
      leaveProject // Dependencia ahora definida
  ]); 

  /**
   * Send a chat message to the current project
   * @param message - The message to send
   */
  const sendMessage = (message: string) => {
    if (!socket.isConnected || !currentProjectId || !session?.user) {
      toast.error('Cannot send message: not connected');
      return;
    }
    
    socket.emit('chat:message', {
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      projectId: currentProjectId,
      message,
      timestamp: Date.now(),
    });
  };

  // Combine socket functionality with additional methods
  const value: SocketContextProps = {
    ...socket,
    activeUsers,
    joinProject,
    leaveProject,
    sendMessage,
    currentProjectId,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Custom hook to use the socket context
 * @returns The socket context
 * @throws Error if used outside of SocketProvider
 */
export function useSocketContext(): SocketContextProps {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  
  return context;
}

export default SocketProvider;
