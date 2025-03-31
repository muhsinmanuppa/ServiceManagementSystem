import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Define io as a module-level variable that will be initialized later
let io = null;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user info to socket
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} - User: ${socket.user?.email}`);
    
    // Join user-specific room
    if (socket.user?._id) {
      socket.join(`user_${socket.user._id}`);
      console.log(`User ${socket.user.email} joined room: user_${socket.user._id}`);
    }
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Function to get the io instance (to avoid undefined errors)
export const getIO = () => {
  if (!io) {
    console.warn('Socket.IO has not been initialized yet');
    return {
      to: () => ({
        emit: () => console.warn('Socket.IO emit called before initialization')
      })
    };
  }
  return io;
};
