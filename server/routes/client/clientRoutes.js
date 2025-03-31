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
import Booking from '../../models/Booking.js'; // Add this import

const router = express.Router();

// Protect all client routes
router.use(authenticateUser);
router.use(authorizeRoles('client'));

// Add debug logging middleware
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

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get active bookings (pending, confirmed, in_progress)
    const activeBookings = await Booking.countDocuments({
      client: userId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    // Get completed services
    const completedServices = await Booking.countDocuments({
      client: userId,
      status: 'completed'
    });

    // Get total services
    const totalServices = await Booking.countDocuments({
      client: userId
    });

    const stats = {
      activeBookings,
      completedServices,
      totalServices
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message  // Add error message for debugging
    });
  }
});

// Booking routes consolidated here
router.get('/bookings', getClientBookings);
router.get('/bookings/:id', getBookingById);
router.post('/bookings', createBooking);
router.post('/bookings/:id/review', async (req, res, next) => {
  try {
    console.log('Review request:', {
      bookingId: req.params.id,
      body: req.body,
      user: req.user._id
    });
    await addReview(req, res);
  } catch (error) {
    next(error);
  }
});
router.post('/bookings/:id/quote-response', handleQuoteResponse);
router.post('/bookings/:id/cancel', cancelBooking);

export { router as clientRoutes };