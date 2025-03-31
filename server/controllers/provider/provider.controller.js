import { promises as fs } from 'fs';  // Change this line to use fs.promises
import { uploadToCloudinary } from '../../config/cloudinary.js';
import User from '../../models/User.js';
import Service from '../../models/Service.js';
import Booking from '../../models/Booking.js';
import mongoose from 'mongoose';

export const applyForVerification = async (req, res) => {
  try {
    console.log('Received verification request:', { 
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'Missing'
    });

    const { description } = req.body;
    const user = await User.findById(req.user._id);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Please upload a verification document' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ message: 'Business description is required' });
    }

    // Create unique filename with original extension
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    const uniqueFilename = `verification_${user._id}_${Date.now()}`;

    // Upload to specific folder with better organization
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'verification_documents',
      public_id: uniqueFilename,
      resource_type: 'auto',
      allowed_formats: ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'],
      tags: ['verification', `user_${user._id}`],
      context: {
        user_id: user._id.toString(),
        original_name: req.file.originalname
      }
    });

    console.log('Document uploaded successfully:', {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    });

    user.verificationStatus = {
      status: 'pending',
      updatedAt: new Date()
    };

    user.document = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      format: result.format,
      uploadedAt: new Date()
    };

    user.description = description.trim();
    await user.save();

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      verificationStatus: user.verificationStatus,
      document: user.document
    });

  } catch (error) {
    console.error('Verification application error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to submit verification request',
      error: error.message 
    });
  }
};

export const handleVerification = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status, remarks } = req.body;

    const provider = await User.findByIdAndUpdate(
      providerId,
      {
        'verificationStatus.status': status,
        'verificationStatus.remarks': remarks,
        'verificationStatus.updatedAt': new Date(),
        'verificationStatus.updatedBy': req.user.id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Provider ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      provider
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification status' });
  }
};

export const getProviderVerifications = async (req, res) => {
  try {
    const providers = await User.find({
      role: 'provider',
      'verificationStatus.status': 'pending'
    }).select('name email description documents verificationStatus');

    res.json({ providers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers' });
  }
};

export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('verificationStatus document');
    res.json({
      status: user.verificationStatus?.status || 'unverified',
      remarks: user.verificationStatus?.remarks,
      updatedAt: user.verificationStatus?.updatedAt,
      document: user.document
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification status' });
  }
};

export const getProviderStats = async (req, res) => {
  try {
    const providerId = req.user._id;

    // Simple queries without aggregation first
    const [activeCount, completedCount, earnings] = await Promise.all([
      // Active bookings count
      Booking.countDocuments({
        provider: providerId,
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }),

      // Completed services count
      Booking.countDocuments({
        provider: providerId,
        status: 'completed'
      }),

      // Total earnings
      Booking.find({
        provider: providerId,
        status: 'completed',
        'payment.status': 'paid'
      }).select('totalAmount')
    ]);

    // Calculate total earnings
    const totalEarnings = earnings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Prepare stats object
    const stats = {
      activeBookings: activeCount,
      completedServices: completedCount,
      totalEarnings: totalEarnings
    };

    console.log('Provider stats:', stats);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('service', 'title price')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

export const getProviderServices = async (req, res) => {
  try {
    const providerId = req.user.id; 
    const services = await Service.find({ provider: providerId });
    res.json(services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update provider profile
 */
export const updateProviderProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update allowed fields
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { 
        new: true,
        select: '-password -verificationToken -resetPasswordToken'
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating provider profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};