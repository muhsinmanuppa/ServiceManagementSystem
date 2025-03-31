import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'request_created',
        'request_accepted',
        'request_declined',
        'booking_confirmed',
        'booking_completed',
        'booking_cancelled',
        'payment_received',
        'payment_refunded',
        'review_received',
        'system_message'
      ]
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    relatedItem: {
      type: {
        type: String,
        enum: ['request', 'booking', 'payment', 'review', 'service']
      },
      id: {
        type: mongoose.Schema.Types.ObjectId
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Create a compound index for efficient querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
