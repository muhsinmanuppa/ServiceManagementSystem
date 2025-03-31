import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);

    // Join user-specific room
    socket.join(socket.user.id);

    // Join role-specific room
    socket.join(socket.user.role);

    // Add booking notification handlers
    socket.on('booking:accept', async (bookingId) => {
      try {
        const booking = await Booking.findById(bookingId)
          .populate('service')
          .populate('client', 'name email');
        
        if (booking && booking.provider.toString() === socket.user.id) {
          booking.status = 'confirmed';
          await booking.save();
          
          emitBookingUpdate(io, booking);
        }
      } catch (error) {
        console.error('Error accepting booking:', error);
      }
    });

    socket.on('booking:complete', async (bookingId) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.provider.toString() === socket.user.id) {
          booking.status = 'completed';
          booking.completedDate = new Date();
          await booking.save();
          
          emitBookingUpdate(io, booking);
        }
      } catch (error) {
        console.error('Error completing booking:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });

  return io;
};

export const emitBookingUpdate = (io, booking) => {
  // Emit to specific users
  io.to(booking.client.toString()).emit('booking:statusUpdate', booking);
  io.to(booking.provider.toString()).emit('booking:statusUpdate', booking);
};

export const emitNewBooking = (io, booking) => {
  io.to(booking.provider.toString()).emit('booking:new', booking);
};

export default initializeSocketServer;
