import Service from '../models/Service.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';

// Create a service
export const createService = async (req, res) => {
  try {
    const { title, description, price, category, priceRange, pricingDetails } = req.body;
    
    // Validate input
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Make sure price is a number
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Handle price range
    const minPrice = priceRange?.min ? Number(priceRange.min) : numericPrice;
    const maxPrice = priceRange?.max ? Number(priceRange.max) : null;

    if (isNaN(minPrice) || minPrice <= 0) {
      return res.status(400).json({ message: 'Minimum price must be a positive number' });
    }
    
    if (maxPrice !== null && (isNaN(maxPrice) || maxPrice <= minPrice)) {
      return res.status(400).json({ message: 'Maximum price must be greater than minimum price' });
    }

    // Upload single image if provided
    let imageUrl = '';
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading image' });
      }
    }

    // Create service
    const service = new Service({
      title: title.trim(),
      description: description.trim(),
      price: numericPrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      pricingDetails: pricingDetails || '',
      category: category || null,
      provider: req.user.id,
      imageUrl, // Store single image URL
      status: req.user.role === 'admin' ? 'active' : 'pending'
    });

    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error creating service'
    });
  }
};

// Get all services with filtering and pagination
export const getServices = async (req, res) => {
  try {
    const { 
      category, 
      provider, 
      status, 
      search,
      minPrice,
      maxPrice,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (category) query.category = category;
    if (provider) query.provider = provider;
    if (status) query.status = status;
    
    // Only show active services to clients
    if (!req.user || req.user.role === 'client') {
      query.status = 'active';
    }
    
    // If provider is viewing their own services, show all their services regardless of status
    if (req.user?.role === 'provider') {
      query.provider = req.user.id;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Pagination setup
    const skip = (page - 1) * limit;
    const pageSize = parseInt(limit);
    
    const services = await Service.find(query)
      .populate('category', 'name')
      .populate('provider', 'name email')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    
    const total = await Service.countDocuments(query);
    
    res.json({
      services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get service by ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id)
      .populate('category', 'name')
      .populate('provider', 'name email phone');
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // If service is not active and the requester is not the provider or an admin, don't show it
    if (
      service.status !== 'active' && 
      (!req.user || 
        (req.user.role !== 'admin' && 
         req.user.id !== service.provider._id.toString())
      )
    ) {
      return res.status(403).json({ message: 'Service is not available' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, priceRange, pricingDetails, status } = req.body;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user is authorized to update this service
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }
    
    // Update fields if provided
    if (title) service.title = title;
    if (description) service.description = description;
    if (price) service.price = Number(price);
    if (category) service.category = category;
    
    // Update price range if provided
    if (priceRange) {
      service.priceRange = {
        min: Number(priceRange.min) || service.price,
        max: priceRange.max ? Number(priceRange.max) : null
      };
    }
    
    if (pricingDetails !== undefined) service.pricingDetails = pricingDetails;
    
    // Only admin can change status
    if (status && req.user.role === 'admin') {
      service.status = status;
    }
    
    // Update image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      service.imageUrl = result.secure_url;
    }
    
    await service.save();
    
    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user is authorized to delete this service
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }
    
    await service.deleteOne();
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update service status (admin only)
export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    // Validate status
    if (!['pending', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Update service status
    service.status = status;
    
    // Add rejection reason if provided and status is inactive
    if (status === 'inactive' && rejectionReason) {
      service.rejectionReason = rejectionReason;
    }
    
    await service.save();
    
    // Notify the provider about status change (would use a notification or email service here)
    
    res.json({
      message: 'Service status updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all services (with filtering options)
export const getAllServices = async (req, res) => {
  try {
    const { search, category } = req.query;
    console.log('Received query params:', { search, category });

    const filter = { status: 'active' };

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    console.log('Using filter:', filter);

    const services = await Service.find(filter)
      .populate('category', 'name')
      .populate('provider', 'name email')
      .sort('-createdAt');

    res.json({ services });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching services' });
  }
};

// Get services by provider ID
export const getProviderServices = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const services = await Service.find({ provider: providerId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get featured/highlighted services
export const getFeaturedServices = async (req, res) => {
  try {
    console.log('Fetching featured services');
    
    // Get active services directly
    const services = await Service.find({ 
      status: 'active'  
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('provider', 'name')
    .populate('category', 'name')
    .lean();

    console.log('Found services:', services.length);

    // Return the array directly, not wrapped in an object
    res.json(services);
    
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({ message: error.message });
  }
};

// Simple search services method
export const searchServices = async (req, res) => {
  try {
    const { query = '', category = '' } = req.query;
    
    console.log('Search params:', { query, category });

    const filter = { status: 'active' };

    // Simple search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Simple category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    const services = await Service.find(filter)
      .populate('category', 'name')
      .populate('provider', 'name email')
      .sort('-createdAt')
      .lean();

    console.log(`Found ${services.length} services`);
    
    return res.status(200).json({
      success: true,
      services
    });

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error searching services',
      error: err.message
    });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleLowerCase();
    
    // Check if date is blocked in customDates
    const customDate = service.availability.customDates.find(
      d => d.date.toDateString() === requestedDate.toDateString()
    );
    
    if (customDate && !customDate.available) {
      return res.json({
        available: false,
        reason: customDate.reason
      });
    }

    // Get available slots for the day
    const daySchedule = service.availability.schedule.find(s => s.day === dayOfWeek);
    
    if (!daySchedule) {
      return res.json({
        available: false,
        reason: 'No service available on this day'
      });
    }

    // Check existing bookings
    const existingBookings = await Booking.countDocuments({
      service: serviceId,
      scheduledDate: {
        $gte: new Date(date).setHours(0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59)
      }
    });

    const availableSlots = daySchedule.slots.map(slot => ({
      ...slot,
      available: existingBookings < slot.maxBookings
    }));

    res.json({
      available: availableSlots.some(slot => slot.available),
      slots: availableSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateServiceAvailability = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { schedule, customDates } = req.body;

    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    // Update availability
    service.availability = {
      schedule: schedule || service.availability.schedule,
      customDates: customDates || service.availability.customDates
    };

    await service.save();

    res.json({
      message: 'Availability updated successfully',
      availability: service.availability
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability' });
  }
};

export const getServiceCalendar = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { startDate, endDate } = req.query;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Get all bookings for this service within date range
    const bookings = await Booking.find({
      service: serviceId,
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('client', 'name');

    // Convert bookings to calendar events
    const events = bookings.map(booking => ({
      id: booking._id,
      title: `Booking - ${booking.client.name}`,
      start: new Date(booking.scheduledDate),
      end: new Date(new Date(booking.scheduledDate).getTime() + 60 * 60 * 1000), // 1 hour duration
      status: booking.status
    }));

    // Add unavailable slots from service availability
    service.availability.customDates.forEach(customDate => {
      if (customDate.isHoliday) {
        events.push({
          title: `Holiday - ${customDate.reason || 'Unavailable'}`,
          start: new Date(customDate.date),
          end: new Date(new Date(customDate.date).setHours(23, 59, 59)),
          isHoliday: true
        });
      }
    });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
