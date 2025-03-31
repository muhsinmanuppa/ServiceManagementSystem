import razorpay from '../config/razorpay.js';
import Booking from '../models/Booking.js';
import crypto from 'crypto';
import { createInvoiceData } from '../utils/invoiceUtils.js';
import { getIO } from '../socket/socket.js';

// Utility function for payment verification
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generated_signature === signature;
};

// Initiate payment for a booking
export const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title price');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify that the user making the request is the booking client
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to make payment for this booking' });
    }
    
    // Check if payment is already completed
    if (booking.payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment already completed' });
    }
    
    // Create a Razorpay order
    const amount = booking.totalAmount || booking.service.price;
    const currency = 'INR';
    
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt: `booking_${booking._id}`,
      payment_capture: 1 // auto-capture
    };
    
    const order = await razorpay.orders.create(options);
    
    // Update booking with order details
    booking.payment.orderId = order.id;
    await booking.save();
    
    res.json({
      orderId: order.id,
      amount: amount * 100,
      currency,
      bookingId: booking._id
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
};

// Verify payment after completion
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment verification'
      });
    }

    // Update booking status
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId },
      {
        'payment.status': 'paid',
        'payment.orderId': razorpay_order_id,
        'payment.paymentId': razorpay_payment_id,
        'payment.paidAt': new Date(),
        status: 'confirmed'
      },
      { new: true }
    );

    res.json({
      success: true,
      booking,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
};

// Generate invoice for a booking - Use the imported function from invoiceUtils
export const generateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title price')
      .populate('provider', 'name email phone address')
      .populate('client', 'name email phone address');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking is completed and paid
    if (booking.status !== 'completed' || booking.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Invoice can only be generated for completed and paid bookings' });
    }
    
    // Verify that the user making the request is authorized
    if (
      req.user.role !== 'admin' && 
      booking.client.toString() !== req.user._id.toString() && 
      booking.provider.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }
    
    // Use the createInvoiceData utility function 
    const invoice = createInvoiceData(booking);
    
    res.json({ invoice });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const bookings = await Booking.find({ 
      client: userId,
      'payment.status': { $exists: true }
    })
    .populate('service', 'title price')
    .populate('provider', 'name')
    .sort({ createdAt: -1 })
    .lean();

    const payments = bookings.map(booking => {
      // Get latest tracking status
      const latestTracking = booking.tracking?.length > 0 
        ? booking.tracking[booking.tracking.length - 1] 
        : null;

      return {
        _id: booking._id,
        date: booking.payment?.paidAt || booking.updatedAt,
        amount: booking.totalAmount || booking.quote?.price || 0,
        paymentStatus: booking.payment?.status || 'pending',
        orderId: booking.payment?.orderId,
        paymentId: booking.payment?.paymentId,
        service: booking.service?.title,
        provider: booking.provider?.name,
        createdAt: booking.createdAt,
        workStatus: latestTracking?.status || booking.status,
        lastUpdated: latestTracking?.timestamp || booking.updatedAt,
        trackingNotes: latestTracking?.notes
      };
    });

    return res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    // Create a Razorpay order
    const options = {
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `booking_${bookingId}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: options.amount,
      currency: options.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order'
    });
  }
};