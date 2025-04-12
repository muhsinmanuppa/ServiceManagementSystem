import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';
import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import { 
  applyForVerification,
  getVerificationStatus,
  getProviderStats,
  updateProviderProfile
} from '../../controllers/provider/provider.controller.js';
import { uploadDocs, verificationUpload, handleUploadError } from '../../middleware/upload.middleware.js';
import { 
  getProviderAnalytics, 
  getServiceAnalytics as getAnalyticsForService, 
  generateReport 
} from '../../controllers/analytics.controller.js';
import { 
  createService, 
  updateService, 
  deleteService,
  getProviderServices,
  getServiceById
} from '../../controllers/provider/service.controller.js';
import { getProviderBookings, getBookingById, updateBookingStatus, submitQuote } from '../../controllers/booking.controller.js';

const router = express.Router();

// Apply auth middleware to all provider routes
router.use(authenticateUser);
router.use(authorizeRoles('provider'));

// Simplified verification routes
router.post(
  '/apply-verification', 
  uploadDocs.single('document'),
  applyForVerification
);
router.get('/verification-status', getVerificationStatus);
router.get('/stats', getProviderStats);

// Analytics routes
router.get('/analytics', getProviderAnalytics);
router.get('/analytics/overview', getProviderAnalytics);
router.get('/analytics/service/:serviceId', getAnalyticsForService);
router.get('/analytics/report', generateReport);

// Service routes - order matters!
router.get('/services/:id', async (req, res, next) => {
  try {
    console.log('Fetching service:', req.params.id);
    await getServiceById(req, res);
  } catch (error) {
    next(error);
  }
});
router.get('/services', getProviderServices);
router.post('/services', uploadDocs.single('serviceImage'), handleUploadError, createService);
router.put('/services/:id', uploadDocs.single('serviceImage'), handleUploadError, updateService);
router.delete('/services/:id', deleteService);

// Profile routes
router.put('/profile', updateProviderProfile);

// Provider booking routes
router.get('/bookings', getProviderBookings);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/quote', submitQuote);

// Update the requests route to properly handle errors
router.get('/requests', async (req, res) => {
  try {
    const pendingBookings = await Booking.find({ 
      provider: req.user._id,
      status: 'pending'
    })
    .populate('client', 'name email')
    .populate('service', 'title imageUrl price')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: pendingBookings.map(booking => ({
        _id: booking._id,
        client: booking.client,
        service: booking.service,
        scheduledDate: booking.scheduledDate,
        notes: booking.notes,
        status: booking.status,
        amount: booking.service?.price || 0,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const providerId = req.user._id;

    const [activeBookings, completedServices, earnings] = await Promise.all([
      // Count active bookings (pending, confirmed, in_progress)
      Booking.countDocuments({
        provider: providerId,
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }),
      
      // Count completed services
      Booking.countDocuments({
        provider: providerId,
        status: 'completed'
      }),
      
      // Calculate total earnings from completed & paid bookings
      Booking.aggregate([
        {
          $match: {
            provider: new mongoose.Types.ObjectId(providerId),
            status: 'completed',
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      activeBookings,
      completedServices,
      totalEarnings: earnings[0]?.total || 0
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

export default router;
