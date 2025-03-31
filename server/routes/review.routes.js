import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import {
  createReview,
  getServiceReviews,
  getClientReviews,
  getProviderReviews,
  updateReview,
  respondToReview,
  markReviewHelpful,
  reportReview
} from '../controllers/review.controller.js';

const router = express.Router();

// Create a new review
router.post('/', authenticateUser, createReview);

// Get reviews for a service
router.get('/service/:serviceId', getServiceReviews);

// Get reviews by client (own reviews)
router.get('/client', authenticateUser, getClientReviews);

// Get reviews for provider
router.get('/provider', authenticateUser, getProviderReviews);

// Update a review (client only)
router.put('/:reviewId', authenticateUser, updateReview);

// Provider response to a review
router.post('/:reviewId/response', authenticateUser, respondToReview);

// Mark a review as helpful
router.post('/:reviewId/helpful', authenticateUser, markReviewHelpful);

// Report a review
router.post('/:reviewId/report', authenticateUser, reportReview);

export default router;
