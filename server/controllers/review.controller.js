import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';

// Add error wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a new review
export const createReview = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId, bookingId, rating, comment } = req.body;
    
    if (!serviceId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate rating
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }
    
    // Get service details to find the provider ID
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // If bookingId provided, verify the booking belongs to this user and service
    let bookingVerified = false;
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        client: req.user.id,
        service: serviceId,
        status: 'completed'
      });
      
      if (!booking) {
        return res.status(400).json({ message: 'Invalid or incomplete booking' });
      }
      bookingVerified = true;
    }
    
    // Check if user has already reviewed this service
    const existingReview = await Review.findOne({
      client: req.user.id,
      service: serviceId
    });
    
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this service' });
    }
    
    // Create the review
    const review = new Review({
      service: serviceId,
      booking: bookingId,
      client: req.user.id,
      provider: service.provider,
      rating: numericRating,
      comment,
      verified: bookingVerified
    });
    
    await review.save({ session });
    
    // Update service average rating
    const allServiceReviews = await Review.find({ 
      service: serviceId,
      status: 'approved'
    }).session(session);
    
    const totalRatings = allServiceReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRatings / allServiceReviews.length;
    
    await Service.findByIdAndUpdate(serviceId, {
      averageRating: avgRating.toFixed(1),
      reviewCount: allServiceReviews.length
    }, { session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Review creation error:', error);
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Get reviews for a service
export const getServiceReviews = asyncHandler(async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { limit = 10, page = 1, sort = 'newest' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let sortOption = {};
    switch (sort) {
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }
    
    const reviews = await Review.find({
      service: serviceId,
      status: 'approved'
    })
      .populate('client', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({
      service: serviceId,
      status: 'approved'
    });
    
    // Calculate rating summary
    const ratingCounts = [5, 4, 3, 2, 1].map(async (rating) => {
      const count = await Review.countDocuments({
        service: serviceId,
        rating,
        status: 'approved'
      });
      return { rating, count };
    });
    
    const ratingSummary = await Promise.all(ratingCounts);
    
    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      ratingSummary
    });
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get reviews by a client
export const getClientReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await Review.find({ client: req.user.id })
      .populate('service', 'title imageUrl')
      .populate('provider', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching client reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for a provider
export const getProviderReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.user.id })
      .populate('service', 'title imageUrl')
      .populate('client', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update review (client can update their own review)
export const updateReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Ensure user can only update their own reviews
    if (review.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Only allow updates if review is recent (e.g., within 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (new Date(review.createdAt) < thirtyDaysAgo) {
      return res.status(403).json({ message: 'Cannot update reviews older than 30 days' });
    }
    
    // Update fields if provided
    if (rating) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }
      review.rating = numericRating;
    }
    
    if (comment) {
      review.comment = comment;
    }
    
    await review.save();
    
    // Update service average rating
    const service = review.service;
    const allServiceReviews = await Review.find({ 
      service,
      status: 'approved'
    });
    
    const totalRatings = allServiceReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRatings / allServiceReviews.length;
    
    await Service.findByIdAndUpdate(service, {
      averageRating: avgRating.toFixed(1)
    });
    
    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Provider response to a review
export const respondToReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({ message: 'Response text is required' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Ensure the user is the provider who received the review
    if (review.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }
    
    review.providerResponse = response;
    review.responseDate = new Date();
    
    await review.save();
    
    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding response to review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark review as helpful (for clients)
export const markReviewHelpful = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Increment helpful count
    review.helpfulCount += 1;
    await review.save();
    
    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: error.message });
  }
});

// Report a review (for inappropriate content)
export const reportReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for reporting' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Mark as reported
    review.reportedCount += 1;
    review.isReported = true;
    review.reportReason = reason;
    
    // If reported more than threshold times, change status to pending for admin review
    if (review.reportedCount >= 3) {
      review.status = 'pending';
    }
    
    await review.save();
    
    res.json({
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ message: error.message });
  }
});
