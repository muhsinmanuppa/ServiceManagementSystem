import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import http from 'http';
import { initializeSocket } from './socket/socket.js';
import { clientRoutes } from './routes/client/clientRoutes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// debugging
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Undefined');
console.log('- SMTP_HOST:', process.env.SMTP_HOST);
console.log('- SMTP_PORT:', process.env.SMTP_PORT);
console.log('- SMTP_USER:', process.env.SMTP_USER ? 'Defined' : 'Undefined');
console.log('- CLIENT_URL:', process.env.CLIENT_URL);

// routes
import authRouter from './routes/auth.js';
import serviceRoutes from './routes/provider/service.routes.js';
import reviewRoutes from './routes/review.routes.js';
import categoryRoutes from './routes/category.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import testRoutes from './routes/test.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import providerRoutes from './routes/provider/provider.routes.js';
import profileRoutes from './routes/profile/profile.routes.js'; 
import clientServiceRoutes from './routes/client/service.routes.js';  
import * as authModuleAgain from './routes/auth.js';
import userRouter from './routes/client/user.routes.js'; 
import adminCategoryRoutes from './routes/admin/category.routes.js';

const app = express();

const initializeServer = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    
    // Initialize Socket.IO with the HTTP server and store the instance
    const socketIO = initializeSocket(server);
    console.log('Socket.IO initialized successfully');

    
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
      // 'https://service-management-system-d5mdt5i2e-muhsins-projects-b8ca763f.vercel.app',
      // 'https://service-management-system-git-main-muhsins-projects-b8ca763f.vercel.app',
      // 'https://service-management-system-puce.vercel.app/','https://servicemanagementsystem.onrender.com/',
      'https://servicemanagementsystem.onrender.com','https://servicemanagementsystem-1.onrender.com',
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    app.use(cors({
      origin: function(origin, callback) {
        if (!origin || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.warn("Blocked origin:", origin);
          callback(new Error('Not allowed by CORS'));
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

    // middleware
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // request logging 
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`, {
        hasAuth: !!req.headers.authorization,
        body: req.body ? 'yes' : 'no'
      });
      next();
    });

    // Middleware
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

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`, req.body ? 'with body' : 'no body');
      next();
    });

    app.use(express.json());

    // error handling
    app.use((req, res, next) => {
      req.setTimeout(30000); // 30 seconds timeout
      next();
    });

    app.use('/api/admin/categories', adminCategoryRoutes);
    app.use('/api/provider', providerRoutes);


    // Public routes
    app.use('/api/services', clientServiceRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/auth', authRouter);
    app.use('/api/auth', authModuleAgain.default || authModuleAgain.router || authModuleAgain);
    app.use('/api/client', clientRoutes); 

    app.use('/api/provider/bookings', bookingRoutes);  
    app.use('/api/provider/services', serviceRoutes);
    app.use('/api/provider', providerRoutes);
    
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/test', testRoutes);
    app.use('/api/client', clientRoutes); 

    app.use('/api/profiles', profileRoutes);
    app.use('/api/users', userRouter);  
    app.use('/api/provider', providerRoutes); 

    app.use('/api/admin', adminRoutes);

    app.use('/api/provider/services', serviceRoutes);
    app.use('/api/provider', providerRoutes);

    app.use('/api/bookings', bookingRoutes);


    app.use('/api/payments', paymentRoutes);

    app.get('/', (req, res) => {
      res.send('API is running...');
    });
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`, {
        body: !!req.body,
        file: !!req.file,
        auth: !!req.headers.authorization
      });
      next();
    });

    app.use('/api/client', clientRoutes);
    app.use('/api/provider', providerRoutes);


    // Global error handler
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

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer().catch(console.error);

export default app;
