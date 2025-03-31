import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import http from 'http';
import { initializeSocket } from './socket/socket.js';
import { clientRoutes } from './routes/client/clientRoutes.js'; // Use ES module syntax

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (specify the path explicitly)
dotenv.config({ path: path.join(__dirname, '.env') });

// Log essential configuration for debugging
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Undefined');
console.log('- SMTP_HOST:', process.env.SMTP_HOST);
console.log('- SMTP_PORT:', process.env.SMTP_PORT);
console.log('- SMTP_USER:', process.env.SMTP_USER ? 'Defined' : 'Undefined');
console.log('- CLIENT_URL:', process.env.CLIENT_URL);

// Import routes with proper default exports
import authRouter from './routes/auth.js';
import serviceRoutes from './routes/provider/service.routes.js';
import requestRoutes from './routes/request.routes.js';
import reviewRoutes from './routes/review.routes.js';
import categoryRoutes from './routes/category.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import testRoutes from './routes/test.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import providerRoutes from './routes/provider/provider.routes.js';
import profileRoutes from './routes/profile/profile.routes.js'; // Updated import
import clientServiceRoutes from './routes/client/service.routes.js';  // Add this import
import * as authModuleAgain from './routes/auth.js';
import userRouter from './routes/client/user.routes.js'; // Add this import

// Import admin routes
import adminCategoryRoutes from './routes/admin/category.routes.js';

const app = express();

// Initialize server
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO with the HTTP server and store the instance
    const socketIO = initializeSocket(server);
    console.log('Socket.IO initialized successfully');

    // Add appropriate headers for Vercel deployment
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', true);
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    app.use(cors({
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log("Blocked origin:", origin);
          callback(null, true); // Still allow in development mode
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Add PATCH
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.get('/api/test/ping', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running'
      });
    });

    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // After public routes, setup middleware
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Add request logging - ONLY ONCE
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`, {
        hasAuth: !!req.headers.authorization,
        body: req.body ? 'yes' : 'no'
      });
      next();
    });

    // Middleware setup - add these before your routes
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

    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`, req.body ? 'with body' : 'no body');
      next();
    });

    app.use(express.json());

    // Add error handling middleware before routes
    app.use((req, res, next) => {
      req.setTimeout(30000); // 30 seconds timeout
      next();
    });

    // Mount admin routes first
    app.use('/api/admin/categories', adminCategoryRoutes);  // Mount at /api/admin/categories

    // Mount provider routes explicitly 
    app.use('/api/provider', providerRoutes);


    // Public routes
    app.use('/api/services', clientServiceRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/auth', authRouter);
    app.use('/api/auth', authModuleAgain.default || authModuleAgain.router || authModuleAgain);
    app.use('/api/client', clientRoutes); // Ensure correct mounting

    // Protected routes
    app.use('/api/provider/bookings', bookingRoutes);  // Mount provider bookings
    app.use('/api/provider/services', serviceRoutes);
    app.use('/api/provider', providerRoutes);
    
    app.use('/api/requests', requestRoutes); // Make sure the requests route is properly mounted

    app.use('/api/reviews', reviewRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/test', testRoutes);
    app.use('/api/client', clientRoutes); // Keep only one mount point for client routes

    // Mount profile routes in the correct order
    app.use('/api/profiles', profileRoutes);
    app.use('/api/users', userRouter);  // Mount user routes
    app.use('/api/provider', providerRoutes); // Keep provider routes after profiles

    // Mount admin routes with proper prefix
    app.use('/api/admin', adminRoutes);

    // Update provider routes mounting
    app.use('/api/provider/services', serviceRoutes);  // Change this line
    app.use('/api/provider', providerRoutes);

    // Fix the booking routes to prevent duplicate controller issues
    app.use('/api/bookings', bookingRoutes);  // This is the correct mounting point


    app.use('/api/payments', paymentRoutes);

    // Move this before your error handling middleware
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`, {
        body: !!req.body,
        file: !!req.file,
        auth: !!req.headers.authorization
      });
      next();
    });

    // Update route mounting
    app.use('/api/client', clientRoutes);
    app.use('/api/provider', providerRoutes);


    // Global error handler - improve to provide more details
    app.use((err, req, res, next) => {
      console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        body: req.body
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

    // Update server startup for Vercel
    if (process.env.VERCEL) {
      // Export the Express app for Vercel
      module.exports = app;
    } else {
      // Start HTTP server normally for local development
      const PORT = process.env.PORT || 5000;
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
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
