// Importar los tipos necesarios
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Socket } from 'socket.io';

// Tipos para eventos de páginas
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

// Configuración del socket para colaboración
export const setupCollabSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Manejar conexiones de socket
  io.on('connection', (socket: Socket) => {
    console.log('Socket conectado:', socket.id);

    // Unirse a un proyecto
    socket.on('join:project', (data: { projectId: string }) => {
      const { projectId } = data;
      console.log(`Socket ${socket.id} uniéndose al proyecto ${projectId}`);
      
      // Unirse a la sala del proyecto
      socket.join(projectId);
      
      // Notificar a todos en la sala que un nuevo usuario se ha unido
      io.to(projectId).emit('join:project', {
        userId: socket.id,
        projectId,
        timestamp: Date.now(),
      });
    });

    // Salir de un proyecto
    socket.on('leave:project', (data: { projectId: string }) => {
      const { projectId } = data;
      console.log(`Socket ${socket.id} saliendo del proyecto ${projectId}`);
      
      // Salir de la sala del proyecto
      socket.leave(projectId);
      
      // Notificar a todos en la sala que un usuario se ha ido
      io.to(projectId).emit('leave:project', {
        userId: socket.id,
        projectId,
        timestamp: Date.now(),
      });
    });

    // Manejar actualizaciones del editor
    socket.on('editor:update', (data: any) => {
      const { projectId } = data;
      if (!projectId) return;
      
      // Reenviar la actualización a todos los demás en la sala
      socket.to(projectId).emit('editor:update', {
        ...data,
        userId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Manejar solicitudes de sincronización completa
    socket.on('editor:request-sync', (data: { projectId: string }) => {
      const { projectId } = data;
      
      // Transmitir la solicitud de sincronización a todos en la sala
      io.to(projectId).emit('editor:request-sync', {
        userId: socket.id,
        projectId,
        timestamp: Date.now(),
      });
    });

    // === EVENTOS DE PÁGINAS ===

    // Solicitud de sincronización de páginas
    socket.on('page:request-sync', (data: { projectId: string }) => {
      const { projectId } = data;
      
      console.log(`Socket ${socket.id} solicitando sincronización de páginas para proyecto ${projectId}`);
      
      // Reenviar la solicitud a todos los demás en la sala
      // (el dueño del proyecto responderá)
      socket.to(projectId).emit('page:request-sync', {
        userId: socket.id,
        projectId,
        timestamp: Date.now(),
      });
    });

    // Sincronización completa de páginas (respuesta a request-sync)
    socket.on('page:full-sync', (data: { pages: PageData[], projectId: string }) => {
      const { pages, projectId } = data;
      
      console.log(`Socket ${socket.id} enviando sincronización completa de ${pages.length} páginas para proyecto ${projectId}`);
      
      // Reenviar la sincronización completa solo al solicitante
      // o a todos si no se especificó un solicitante
      socket.to(projectId).emit('page:full-sync', {
        pages,
        userId: socket.id,
        projectId,
        timestamp: Date.now(),
      });
    });

    // Eventos de cambios en páginas
    socket.on('page:add', (data: PageEventData) => {
      const { projectId } = data;
      if (!projectId) return;
      
      console.log(`Socket ${socket.id} agregó página "${data.pageName}" a proyecto ${projectId}`);
      
      // Reenviar el evento a todos los demás en la sala
      socket.to(projectId).emit('page:add', {
        ...data,
        userId: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on('page:remove', (data: PageEventData) => {
      const { projectId } = data;
      if (!projectId) return;
      
      console.log(`Socket ${socket.id} eliminó página "${data.pageName}" de proyecto ${projectId}`);
      
      // Reenviar el evento a todos los demás en la sala
      socket.to(projectId).emit('page:remove', {
        ...data,
        userId: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on('page:update', (data: PageEventData) => {
      const { projectId } = data;
      if (!projectId) return;
      
      console.log(`Socket ${socket.id} actualizó página "${data.pageName}" en proyecto ${projectId}`);
      
      // Reenviar el evento a todos los demás en la sala
      socket.to(projectId).emit('page:update', {
        ...data,
        userId: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on('page:select', (data: PageEventData) => {
      const { projectId } = data;
      if (!projectId) return;
      
      console.log(`Socket ${socket.id} seleccionó página "${data.pageName}" en proyecto ${projectId}`);
      
      // Reenviar el evento a todos los demás en la sala
      socket.to(projectId).emit('page:select', {
        ...data,
        userId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log('Socket desconectado:', socket.id);
    });
  });

  return io;
}; 