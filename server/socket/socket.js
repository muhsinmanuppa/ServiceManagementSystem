import { Server } from 'socket.io';

let io;

export const initializeSocket = (req, res) => {
  if (!io) {
    io = new Server({
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/api/socketio',
    });
  }
  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return null;
  }
  return io;
};
