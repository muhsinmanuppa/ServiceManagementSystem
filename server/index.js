import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import http from 'http';
import { initializeSocket } from './socket/socket.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Import routes
import authRouter from './routes/auth.js';
import serviceRoutes from './routes/provider/service.routes.js';
import requestRoutes from './routes/request.routes.js';
import reviewRoutes from './routes/review.routes.js';
import categoryRoutes from './routes/category.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import providerRoutes from './routes/provider/provider.routes.js';
import profileRoutes from './routes/profile/profile.routes.js';
import clientServiceRoutes from './routes/client/service.routes.js';
import * as clientRoutesModule from './routes/client/clientRoutes.js'; // Changed to namespace import
import userRouter from './routes/client/user.routes.js';
import adminCategoryRoutes from './routes/admin/category.routes.js';

// Extract the router from the client routes module
const clientRoutes = clientRoutesModule.clientRoutes || clientRoutesModule.router || clientRoutesModule.default;

const app = express();

// Initialize server
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO with the HTTP server
    const socketIO = initializeSocket(server);
    console.log('Socket.IO initialized successfully');

    // CORS configuration
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://service-management-system-d5mdt5i2e-muhsins-projects-b8ca763f.vercel.app',
      'https://service-management-system-git-main-muhsins-projects-b8ca763f.vercel.app',
      'https://service-management-system-puce.vercel.app',
      'https://service-management-system-server.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    app.use(cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Middleware setup
    app.use(express.json({ 
      limit: '1mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          res.status(400).send({ message: 'Invalid JSON' });
          throw new Error('Invalid JSON');
        }
      }
    }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request timeout
    app.use((req, res, next) => {
      req.setTimeout(30000); // 30 seconds timeout
      next();
    });

    // Root route
    app.get("/", (req, res) => {
      res.json({
        message: "Service Management System API",
        status: "running",
        version: "1.0.0",
        dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        documentation: "/api/docs"
      });
    });

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // Request logging middleware
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`, {
        body: !!req.body,
        file: !!req.file,
        auth: !!req.headers.authorization
      });
      next();
    });

    // API routes
    app.use('/api/admin/categories', adminCategoryRoutes);
    app.use('/api/services', clientServiceRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/auth', authRouter);
    if (clientRoutes) {
      app.use('/api/client', clientRoutes);
    } else {
      console.warn('Warning: clientRoutes is undefined - check the export in ./routes/client/clientRoutes.js');
    }
    app.use('/api/provider/bookings', bookingRoutes);
    app.use('/api/provider/services', serviceRoutes);
    app.use('/api/provider', providerRoutes);
    app.use('/api/requests', requestRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/profiles', profileRoutes);
    app.use('/api/users', userRouter);
    app.use('/api/admin', adminRoutes);

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('❌ Global Error Handler:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers
      });

      // Check for MongoDB connection errors
      if (err.name === 'MongooseError' || err.name === 'MongoError') {
        return res.status(503).json({
          message: 'Database service unavailable',
          status: 'error',
          timestamp: new Date().toISOString()
        });
      }

      res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        status: 'error',
        path: req.url,
        timestamp: new Date().toISOString()
      });
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;