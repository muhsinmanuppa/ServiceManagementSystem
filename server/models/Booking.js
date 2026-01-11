import mongoose from 'mongoose';

// Define valid statuses as a constant that can be exported
export const VALID_BOOKING_STATUSES = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const RatingSchema = new mongoose.Schema({
  score: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const BookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
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
  scheduledDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(VALID_BOOKING_STATUSES),
    default: VALID_BOOKING_STATUSES.PENDING
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    orderId: String,
    paymentId: String,
    paidAt: Date
  },
  notes: String,
  rating: { type: RatingSchema, default: null },
  quote: {
    price: Number,
    estimatedHours: Number,
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    submittedAt: Date,
    respondedAt: Date
  },
  tracking: [{
    status: {
      type: String,
      enum: Object.values(VALID_BOOKING_STATUSES),
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: String
  }],
  completedAt: Date
}, {
  timestamps: true
});

// Virtual field for booking duration (in days)
BookingSchema.virtual('duration').get(function() {
  if (!this.completedAt) return null;
  
  const startDate = new Date(this.scheduledDate);
  const endDate = new Date(this.completedAt);
  
  const durationMs = endDate - startDate;
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  return durationDays;
});

// Method to check if booking is paid
BookingSchema.methods.isPaid = function() {
  return this.payment && this.payment.status === 'paid';
};

// Method to get current status with timestamp
BookingSchema.methods.getCurrentStatus = function() {
  if (!this.tracking || this.tracking.length === 0) {
    return {
      status: this.status,
      timestamp: this.updatedAt,
      notes: null
    };
  }
  
  // Get the latest tracking entry
  const latestTracking = this.tracking[this.tracking.length - 1];
  
  return {
    status: latestTracking.status,
    timestamp: latestTracking.timestamp,
    notes: latestTracking.notes
  };
};

// Add method to handle quote responses
BookingSchema.methods.handleQuoteResponse = async function(approved, userId) {
  this.quote.approved = approved;
  this.quote.respondedAt = new Date();
  this.status = approved ? 'confirmed' : 'declined';
  
  // Add to tracking history
  this.tracking.push({
    status: this.status,
    timestamp: new Date(),
    updatedBy: userId,
    notes: `Quote ${approved ? 'accepted' : 'declined'} by client`
  });
  
  return this.save();
};

// Add method to handle quote update
BookingSchema.methods.updateQuote = async function(quoteData, providerId) {
  this.quote = {
    ...quoteData,
    submittedAt: new Date(),
    status: 'pending'
  };
  this.status = 'quoted';
  this.totalAmount = quoteData.price;
  
  this.tracking.push({
    status: 'quoted',
    timestamp: new Date(),
    updatedBy: providerId,
    notes: 'Quote provided by service provider'
  });

  return this.save();
};

// Include virtuals when converting to JSON
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

// Add a pre-save middleware to track status changes
BookingSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!Object.values(VALID_BOOKING_STATUSES).includes(this.status)) {
      next(new Error(`Invalid status value: ${this.status}`));
      return;
    }
    this.tracking.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.updatedBy || this.provider,
      notes: `Status updated to ${this.status}`
    });
  }
  next();
});

const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
