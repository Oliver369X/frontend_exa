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
  isProjectOwner: boolean;
}

// Create context with default values
const SocketContext = createContext<SocketContextProps | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

// Agregar tipo para eventos de páginas
type PageData = {
  id: string;
  name: string;
  html?: string;
  css?: string;
  components?: Record<string, unknown>;
};

type PageEventData = {
  pageId: string;
  pageName?: string;
  userId?: string;
  timestamp?: number;
  projectId?: string;
  pageData?: PageData;
};

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
  const [isProjectOwner, setIsProjectOwner] = useState(false); // Estado para controlar si el usuario es dueño del proyecto
  
  const socket = useSocket(); 
  
  // --- NUEVO: useEffect para emitir user-join DESPUÉS de conectar --- 
  useEffect(() => {
      // Si nos acabamos de conectar Y estábamos intentando unirnos a un proyecto
      if (socket.isConnected && isJoining && currentProjectId) {
          console.log(`[SocketProvider] Connection established while trying to join ${currentProjectId}. Emitting user-join.`);
          socket.emit('user-join'); // El servidor obtiene datos del token/handshake
          setIsJoining(false); // Reseteamos el flag de join
          toast.success('Joined project room');
          
          // Comprobar si el usuario es propietario del proyecto
          // Aquí puedes implementar tu lógica real para verificar la propiedad
          // Por ahora usamos una comprobación básica con el ID del usuario de la sesión
          if (session?.user?.id) {
              // Ejemplo: verificar si el usuario es propietario del proyecto (ajustar según tu lógica)
              const checkOwnership = async () => {
                  try {
                      // Si no tienes un endpoint específico, puedes usar una lógica temporal
                      // Por ejemplo, si el proyecto contiene el ID del usuario como creador
                      setIsProjectOwner(currentProjectId.includes(session.user.id));
                      console.log(`[SocketProvider] User is ${isProjectOwner ? '' : 'not '}the owner of this project`);
                  } catch (error) {
                      console.error('[SocketProvider] Error checking project ownership:', error);
                      setIsProjectOwner(false);
                  }
              };
              
              checkOwnership();
          }
      }
      // Si perdemos conexión mientras estábamos unidos, reseteamos
      else if (!socket.isConnected && currentProjectId) {
          console.log('[SocketProvider] Lost connection while in a project room.');
          setCurrentProjectId(null);
          setActiveUsers([]);
          setIsJoining(false);
          setIsProjectOwner(false);
      }
  }, [socket.isConnected, isJoining, currentProjectId, socket.emit, session?.user?.id, isProjectOwner]);

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

  // En el useEffect donde se manejan los eventos del socket
  useEffect(() => {
    // ... manejadores existentes ...

    // Agregar manejadores para eventos de páginas
    const handlePageRequest = (data: { projectId: string }) => {
      console.log('[Socket] Recibida solicitud de sincronización de páginas para el proyecto:', data.projectId);
      
      // Si somos el dueño del proyecto, enviar las páginas actuales
      if (isProjectOwner && data.projectId === currentProjectId) {
        // Intentar obtener las páginas del localStorage
        try {
          const pagesData = localStorage.getItem(`gjs-pages-${currentProjectId}`);
          if (pagesData) {
            const pages = JSON.parse(pagesData) as PageData[];
            console.log(`[Socket] Enviando sincronización completa: ${pages.length} páginas`);
            socket?.emit('page:full-sync', { pages, projectId: currentProjectId });
          }
        } catch (error) {
          console.error('[Socket] Error al enviar sincronización de páginas:', error);
        }
      }
    };

    // Manejadores de eventos de páginas
    socket?.on('page:request-sync', handlePageRequest);
    
    // También escuchar eventos específicos sobre páginas
    socket?.on('page:add', (data: PageEventData) => {
      console.log('[Socket] Página agregada por otro usuario:', data.pageName);
    });
    
    socket?.on('page:remove', (data: PageEventData) => {
      console.log('[Socket] Página eliminada por otro usuario:', data.pageName);
    });
    
    socket?.on('page:update', (data: PageEventData) => {
      console.log('[Socket] Página actualizada por otro usuario:', data.pageName);
    });
    
    socket?.on('page:select', (data: PageEventData) => {
      console.log('[Socket] Página seleccionada por otro usuario:', data.pageName);
    });

    // Al unirse a un proyecto, también solicitar sincronización de páginas
    if (currentProjectId && socket?.connected) {
      console.log('[Socket] Solicitando sincronización inicial de páginas');
      socket.emit('page:request-sync', { projectId: currentProjectId });
    }

    return () => {
      // ... limpieza de manejadores existentes ...
      
      // Limpieza de manejadores de páginas
      socket?.off('page:request-sync', handlePageRequest);
      socket?.off('page:add');
      socket?.off('page:remove');
      socket?.off('page:update');
      socket?.off('page:select');
    };
  }, [socket, isProjectOwner, currentProjectId]);

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
      setIsProjectOwner(false); // Resetear propiedad del proyecto
      
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
    isProjectOwner,
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
