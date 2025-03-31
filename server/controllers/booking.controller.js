import Booking, { VALID_BOOKING_STATUSES } from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { getIO } from '../socket/socket.js';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { serviceId, scheduledDate, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Create booking with appropriate initial data
    const booking = new Booking({
      service: serviceId,
      client: req.user._id,
      provider: service.provider,
      scheduledDate: new Date(scheduledDate),
      notes,
      status: 'pending',
      totalAmount: service.price,
      payment: {
        status: 'pending'
      },
      tracking: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: 'Booking created'
      }]
    });

    await booking.save();

    const populatedBooking = await booking.populate([
      { path: 'service', select: 'title price imageUrl' },
      { path: 'provider', select: 'name email' },
      { path: 'client', select: 'name email' }
    ]);

    // Notify provider about new booking via socket
    const io = getIO();
    io.to(`user_${service.provider}`).emit('booking:new', populatedBooking);

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Booking creation failed:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

// Get bookings for client
export const getClientBookings = async (req, res) => {
  try {
    console.log('Fetching bookings for client:', req.user._id);
    const bookings = await Booking.find({ client: req.user._id })
      .populate('service', 'title price imageUrl')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error in getClientBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get bookings for provider
export const getProviderBookings = async (req, res) => {
  try {
    console.log('Fetching bookings for provider:', req.user._id);
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('service', 'title price imageUrl')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error in getProviderBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    console.log('Getting booking by ID:', req.params.id); // Add logging

    const booking = await Booking.findById(req.params.id)
      .populate('service')
      .populate('provider', 'name email avatar')
      .populate('client', 'name email avatar');
    
    if (!booking) {
      console.log('Booking not found'); // Add logging
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Simplified authorization check
    const userIsAuthorized = 
      req.user.role === 'admin' || 
      booking.client._id.toString() === req.user._id.toString() ||
      booking.provider._id.toString() === req.user._id.toString();

    if (!userIsAuthorized) {
      console.log('User not authorized:', req.user._id); // Add logging
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    console.log('Sending booking data:', booking._id); // Add logging
    res.json(booking);
  } catch (error) {
    console.error('Error in getBookingById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, quote } = req.body;

    console.log('Updating booking status:', { id, status, notes, quote });

    // Validate status before proceeding
    if (!Object.values(VALID_BOOKING_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(VALID_BOOKING_STATUSES).join(', ')}`
      });
    }

    const booking = await Booking.findOne({ _id: id });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    // Verify authorization
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this booking' 
      });
    }

    // Validate status transition
    const isValidTransition = validateStatusTransition(booking.status, status);
    if (!isValidTransition.valid) {
      return res.status(400).json({
        success: false,
        message: isValidTransition.message
      });
    }

    if (quote) {
      // Handle quote submission
      booking.status = 'quoted';  // Set status to quoted when submitting a quote
      await booking.updateQuote({
        price: parseFloat(quote.price),
        estimatedHours: parseInt(quote.estimatedHours),
        notes: quote.notes || ''
      }, req.user._id);

      booking.tracking.push({
        status: 'quoted',
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: quote.notes || 'Quote provided'
      });
    } else {
      // Handle regular status update
      booking.status = status;
      booking.tracking.push({
        status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: notes || `Status updated to ${status}`
      });
    }

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate('client', 'name email')
      .populate('service', 'title price imageUrl');

    // Notify client through socket
    const io = getIO();
    io.to(`user_${booking.client}`).emit('booking:statusUpdate', {
      bookingId: booking._id,
      status: booking.status,
      quote: booking.quote
    });

    res.json({
      success: true,
      message: quote ? 'Quote submitted successfully' : `Booking status updated to ${status}`,
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error updating booking status'
    });
  }
};

// Add helper function to validate status transitions
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    [VALID_BOOKING_STATUSES.PENDING]: [
      VALID_BOOKING_STATUSES.QUOTED,
      VALID_BOOKING_STATUSES.CONFIRMED,
      VALID_BOOKING_STATUSES.CANCELLED
    ],
    [VALID_BOOKING_STATUSES.QUOTED]: [
      VALID_BOOKING_STATUSES.CONFIRMED,
      VALID_BOOKING_STATUSES.CANCELLED
    ],
    [VALID_BOOKING_STATUSES.CONFIRMED]: [
      VALID_BOOKING_STATUSES.IN_PROGRESS,  // Use constant
      VALID_BOOKING_STATUSES.CANCELLED
    ],
    [VALID_BOOKING_STATUSES.IN_PROGRESS]: [  // Use constant
      VALID_BOOKING_STATUSES.COMPLETED,
      VALID_BOOKING_STATUSES.CANCELLED
    ]
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { valid: true };
};

// Add review to booking
export const addReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    console.log('Adding review:', { bookingId, rating, review, userId });

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find the booking
    const booking = await Booking.findOne({
      _id: bookingId,
      client: userId,
      status: VALID_BOOKING_STATUSES.COMPLETED
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for review'
      });
    }

    // Check if review already exists
    if (booking.rating) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Add the review
    booking.rating = {
      score: rating,
      review: review,
      createdAt: new Date()
    };

    await booking.save();

    // Update service rating
    const service = await Service.findById(booking.service);
    if (service) {
      service.ratings.push({
        user: userId,
        score: rating,
        review: review,
        booking: bookingId,
        createdAt: new Date()
      });
      
      // Update average rating
      const totalRatings = service.ratings.length;
      const sumRatings = service.ratings.reduce((sum, r) => sum + r.score, 0);
      service.averageRating = sumRatings / totalRatings;
      service.reviewCount = totalRatings;
      
      await service.save();
    }

    // Populate necessary fields for response
    const populatedBooking = await Booking.findById(bookingId)
      .populate('service', 'title price imageUrl')
      .populate('provider', 'name email')
      .populate('client', 'name email');

    res.json({
      success: true,
      message: 'Review added successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// Get dashboard statistics (for admin and provider)
export const getBookingStats = async (req, res) => {
  try {
    const { role, id } = req.user;
    
    // Only admin and provider can access stats
    if (role !== 'admin' && role !== 'provider') {
      return res.status(403).json({ message: 'Not authorized to access booking stats' });
    }
    
    const query = role === 'provider' ? { provider: id } : {};
    
    // Get total counts by status
    const totalBookings = await Booking.countDocuments(query);
    const pendingBookings = await Booking.countDocuments({ ...query, status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ ...query, status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ ...query, status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ ...query, status: 'cancelled' });
    
    // Get revenue stats
    const revenueQuery = {
      ...query, 
      status: 'completed',
      paymentStatus: 'paid'
    };
    
    // Calculate total revenue
    const completedBookingsWithPayment = await Booking.find(revenueQuery);
    const totalRevenue = completedBookingsWithPayment.reduce(
      (sum, booking) => sum + booking.totalAmount,
      0
    );
    
    // Get monthly stats for the current year
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st of current year
    const endDate = new Date(currentYear + 1, 0, 0); // December 31st of current year
    
    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          ...query,
          scheduledDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$scheduledDate' } },
          count: { $sum: 1 },
          revenue: { 
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);
    
    // Format monthly data
    const monthlyStats = Array(12).fill().map((_, i) => ({
      month: i + 1,
      bookings: 0,
      revenue: 0
    }));
    
    monthlyBookings.forEach(item => {
      const monthIndex = item._id.month - 1;
      monthlyStats[monthIndex] = {
        month: item._id.month,
        bookings: item.count,
        revenue: item.revenue
      };
    });
    
    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      monthlyStats
    });
  } catch (error) {
    console.error('Error generating booking stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for admin
export const getAdminBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('service')
      .populate('client', 'name email')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleQuoteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, status } = req.body;

    const booking = await Booking.findOne({ 
      _id: id,
      client: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.quote) {
      return res.status(400).json({
        success: false,
        message: 'No quote found for this booking'
      });
    }

    booking.status = status;
    booking.quote.approved = approved;
    booking.quote.respondedAt = new Date();

    // Add to tracking history
    booking.tracking.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: `Quote ${approved ? 'accepted' : 'declined'} by client`
    });

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate('client', 'name email')
      .populate('service', 'title price imageUrl')
      .populate('provider', 'name email');

    // Notify provider via socket
    const io = getIO();
    io.to(`user_${booking.provider}`).emit('booking:quoteResponse', {
      bookingId: booking._id,
      approved,
      status
    });

    res.json({
      success: true,
      message: `Quote ${approved ? 'accepted' : 'declined'} successfully`,
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error handling quote response:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing quote response'
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ 
      _id: id,
      client: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'This booking cannot be cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.tracking.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: 'Booking cancelled by client'
    });

    await booking.save();

    const updatedBooking = await booking.populate([
      { path: 'service', select: 'title price imageUrl' },
      { path: 'provider', select: 'name email' }
    ]);

    // Notify provider via socket
    const io = getIO();
    io.to(`user_${booking.provider}`).emit('booking:cancelled', {
      bookingId: booking._id,
      status: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
};

// Add submitQuote controller
export const submitQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, estimatedHours, notes } = req.body;

    const booking = await Booking.findOne({ 
      _id: id,
      provider: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking with quote
    await booking.updateQuote({
      price: parseFloat(price),
      estimatedHours: parseInt(estimatedHours),
      notes: notes || ''
    }, req.user._id);

    const updatedBooking = await Booking.findById(id)
      .populate('client', 'name email')
      .populate('service', 'title price imageUrl')
      .populate('provider', 'name email');

    // Notify client via socket
    const io = getIO();
    io.to(`user_${booking.client}`).emit('booking:quoted', {
      bookingId: booking._id,
      quote: booking.quote
    });

    res.json({
      success: true,
      message: 'Quote submitted successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quote'
    });
  }
};

