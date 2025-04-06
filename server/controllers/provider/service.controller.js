import Service from '../../models/Service.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import User from '../../models/User.js';
import mongoose from 'mongoose';

export const createService = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    // Validate input
    if (!title?.trim() || !description?.trim() || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Handle buffered image upload
    let imageUrl = null;
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'services',
          width: 1000,
          crop: 'scale',
          resource_type: 'auto'
        });
        imageUrl = uploadResult.secure_url;
        
        console.log('Uploaded image URL:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Create service
    const service = new Service({
      provider: req.user._id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      imageUrl
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProviderServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id })
      .populate('category', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services' 
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify ownership
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    // Delete images from Cloudinary
    if (service.images?.length) {
      await Promise.all(
        service.images.map(image => 
          deleteFromCloudinary(image.publicId).catch(console.error)
        )
      );
    }

    // Delete service
    await service.deleteOne();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Service deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
};

export const getServiceById = async (req, res) => {
  try {
    console.log('Fetching service with ID:', req.params.id);
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid MongoDB ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Add debug logging for user ID
    console.log('Provider ID:', req.user._id);

    // Change query to find service first without provider check
    const service = await Service.findById(req.params.id)
      .populate('category');
    
    // Log found service
    console.log('Found service:', service);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check provider after finding service for better debugging
    if (service.provider.toString() !== req.user._id.toString()) {
      console.log('Provider mismatch:', {
        serviceProvider: service.provider,
        requestingUser: req.user._id
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this service'
      });
    }

    res.json({
      success: true,
      service: {
        _id: service._id,
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category._id,
        categoryName: service.category.name,
        imageUrl: service.imageUrl,
        status: service.status
      }
    });

  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category } = req.body;

    const service = await Service.findOne({ 
      _id: id,
      provider: req.user._id 
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Handle buffered image upload if new image is provided
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'services',
          width: 1000,
          crop: 'scale',
          resource_type: 'auto'
        });
        service.imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Update other fields
    if (title) service.title = title.trim();
    if (description) service.description = description.trim();
    if (price) service.price = parseFloat(price);
    if (category) service.category = category;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};
