import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('join:community', (communityId) => {
      socket.join(`community:${communityId}`);
    });

    socket.on('leave:community', (communityId) => {
      socket.leave(`community:${communityId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
