import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { 
  createBooking,
  getClientBookings,
  getProviderBookings,
  getAdminBookings,
  getBookingById,
  updateBookingStatus,
  addReview,
  getBookingStats,
  handleQuoteResponse
} from '../controllers/booking.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Client routes
router.get('/client', getClientBookings);

// Provider routes
router.get('/provider', getProviderBookings);

// Status update routes
router.put('/:id/status', updateBookingStatus);
router.patch('/:id/status', updateBookingStatus);
router.put('/:id/quote-response', handleQuoteResponse); // Remove redundant authenticateUser

// Admin routes
router.get('/admin', authorizeRoles(['admin']), getAdminBookings);
router.get('/stats', getBookingStats);

// Shared routes
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.post('/:bookingId/review', addReview);

export default router;
