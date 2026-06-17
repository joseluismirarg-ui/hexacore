import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id);

    // Opcional: Unirse a rooms específicos (ej. un room para el tenant, o un room global para el Admin)
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`[Socket.io] Socket ${socket.id} joined admin_room`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io no está inicializado');
  }
  return io;
};
