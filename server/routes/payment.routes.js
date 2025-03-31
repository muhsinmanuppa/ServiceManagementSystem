import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import {
  initiatePayment,
  verifyPayment,
  generateInvoice,
  getPaymentHistory,
  createOrder
} from '../controllers/payment.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Payment routes
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory); // Use consistent endpoint
router.get('/bookings/:bookingId/invoice', generateInvoice);

export default router;
