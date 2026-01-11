import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';
import {
  getBookingById,
  getClientBookings,
  createBooking,
  addReview,
  handleQuoteResponse,
  cancelBooking
} from '../../controllers/booking.controller.js';
import { addReviewForBooking } from '../../controllers/review.controller.js'; // ✅ ESM import
import Booking from '../../models/Booking.js';

const router = express.Router();

// ✅ Protect all client routes
router.use(authenticateUser);
router.use(authorizeRoles('client'));

// ✅ Debug logging middleware
router.use((req, res, next) => {
  console.log('Client Route Request:', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    userId: req.user?._id
  });
  next();
});

// ✅ Stats route
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    const activeBookings = await Booking.countDocuments({
      client: userId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    const completedServices = await Booking.countDocuments({
      client: userId,
      status: 'completed'
    });

    const totalServices = await Booking.countDocuments({
      client: userId
    });

    const stats = { activeBookings, completedServices, totalServices };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ✅ Booking routes
router.get('/bookings', getClientBookings);
router.get('/bookings/:id', getBookingById);
router.post('/bookings', createBooking);
router.post('/bookings/:id/review', (req, res, next) => {
  // normalize param name expected by the controller
  req.params.bookingId = req.params.id;
  return addReviewForBooking(req, res, next);
});
router.post('/bookings/:id/quote-response', handleQuoteResponse);
router.post('/bookings/:id/cancel', cancelBooking);

// ✅ ESM export
export { router as clientRoutes };
