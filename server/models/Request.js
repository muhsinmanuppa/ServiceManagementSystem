import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  budget: {
    min: Number,
    max: Number
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  preferredSchedule: {
    startDate: Date,
    flexibleTiming: Boolean
  },
  proposals: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: Number,
    description: String,
    estimatedDuration: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    url: String,
    filename: String,
    mimetype: String
  }]
}, {
  timestamps: true
});

// Indexes
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ client: 1, status: 1 });
requestSchema.index({ category: 1, status: 1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;
