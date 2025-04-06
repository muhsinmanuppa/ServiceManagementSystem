import Request from '../models/Request.js'; // Add this line
import Service from '../models/Service.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { createNotification } from '../utils/notificationUtils.js';
import Booking from '../models/Booking.js';

// Create new service request
export const createRequest = async (req, res) => {
  try {
    const { serviceId, requestedDate, notes } = req.body;
    
    // Validate service exists
    const service = await Service.findById(serviceId)
      .populate('provider', 'verificationStatus');
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if provider is verified
    if (service.provider.verificationStatus?.status !== 'verified') {
      return res.status(400).json({ 
        message: 'Cannot request service from unverified provider' 
      });
    }

    // Handle file uploads if any
    const attachments = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path);
        attachments.push({
          name: file.originalname,
          url: result.secure_url,
          uploadedAt: new Date()
        });
      }
    }

    const request = new Request({
      client: req.user._id,
      provider: service.provider,
      service: serviceId,
      requestedDate: new Date(requestedDate),
      amount: service.price,
      notes,
      attachments
    });

    await request.save();

    res.status(201).json({
      success: true,
      request: await request.populate(['service', 'provider'])
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Error creating service request' });
  }
};

// Get requests (for client or provider)
export const getRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    
    // Filter by user type (client/provider)
    if (type === 'provider') {
      query.provider = req.user._id;
    } else {
      query.client = req.user._id;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .populate('service')
      .populate('client', 'name email')
      .populate('provider', 'name email')
      .sort('-createdAt');

    res.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// Get request by ID
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id)
      .populate('service')
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Ensure user has access to this request
    if (
      req.user.id !== request.client.toString() && 
      req.user.id !== request.provider.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to access this request' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Verify user is the provider for this request
    if (request.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update request
    request.status = status;
    if (notes) request.notes = notes;
    if (status === 'completed') request.completionDate = new Date();
    
    await request.save();
    
    res.json({ success: true, request });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Error updating request' });
  }
};

// Client adds a message to an existing request
export const addMessageToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Ensure the user is part of this request
    if (
      req.user.id !== request.client.toString() && 
      req.user.id !== request.provider.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Initialize messages array if it doesn't exist
    if (!request.messages) {
      request.messages = [];
    }
    
    // Add message
    request.messages.push({
      sender: req.user.id,
      senderType: req.user.id === request.client.toString() ? 'client' : 'provider',
      content: message,
      timestamp: new Date()
    });
    
    await request.save();
    
    res.json({
      message: 'Message added successfully',
      request
    });
    
    // Notify other party (would implement notification logic here)
    
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all requests for a provider
export const getProviderRequests = async (req, res) => {
  try {
    const pendingBookings = await Booking.find({ 
      provider: req.user._id,
      status: 'pending'
    })
    .populate('client', 'name email')
    .populate('service', 'title imageUrl price')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: pendingBookings.map(booking => ({
        _id: booking._id,
        client: booking.client,
        service: booking.service,
        scheduledDate: booking.scheduledDate,
        notes: booking.notes,
        status: booking.status,
        amount: booking.service.price,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching requests'
    });
  }
};

// Update request status (accept/decline with quote)
export const updateProviderRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, quote } = req.body;
    
    const booking = await Booking.findOne({ 
      _id: requestId,
      provider: req.user._id
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.status = status;
    if (quote) {
      booking.quote = quote;
    }
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(requestId)
      .populate('client', 'name email')
      .populate('service', 'title imageUrl price');
    
    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
};
