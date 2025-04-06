import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  providerResponse: {
    type: String,
    trim: true
  },
  responseDate: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  reportReason: String
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ service: 1, client: 1 }, { unique: true });
reviewSchema.index({ service: 1, status: 1 });
reviewSchema.index({ provider: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
