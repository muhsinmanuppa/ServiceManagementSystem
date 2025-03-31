import User from '../../models/User.js';
import { sendVerificationStatusEmail } from '../../utils/emailUtils.js';

export const getPendingVerifications = async (req, res) => {
  try {
    const providers = await User.find({
      role: 'provider',
      'verificationStatus.status': 'pending'
    }).select('name email description document verificationStatus createdAt');

    res.json({ success: true, providers });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ message: 'Failed to fetch verifications' });
  }
};

export const getProviderDetails = async (req, res) => {
  try {
    const provider = await User.findById(req.params.providerId)
      .select('-password');

    if (!provider) {
      return res.status(404).json({ 
        success: false,
        message: 'Provider not found' 
      });
    }

    res.json({ 
      success: true,
      provider 
    });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching provider details',
      error: error.message 
    });
  }
};

export const handleVerification = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status, remarks } = req.body;

    console.log('Handling verification:', { providerId, status, remarks });

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification status' 
      });
    }

    if (status === 'rejected' && !remarks?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Remarks are required when rejecting verification' 
      });
    }

    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({ 
        success: false,
        message: 'Provider not found' 
      });
    }

    provider.verificationStatus = {
      status,
      remarks: remarks || '',
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    await provider.save();

    // Send email notification
    await sendVerificationStatusEmail(provider.email, status, remarks);

    res.json({
      success: true,
      message: `Provider ${status === 'verified' ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing verification',
      error: error.message 
    });
  }
};

export const getAllProviders = async (req, res) => {
  try {
    console.log('Fetching providers with query:', req.query);
    const { status, search, verificationStatus } = req.query;
    const filter = { role: 'provider' };

    // Add filters
    if (status) filter.status = status;
    if (verificationStatus) filter['verificationStatus.status'] = verificationStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Final filter:', filter);

    const providers = await User.find(filter)
      .select('name email description verificationStatus document createdAt status')
      .sort({ createdAt: -1 });

    console.log(`Found ${providers.length} providers`);

    res.json({ 
      success: true, 
      providers,
      query: req.query,
      filter
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
};

export const updateProviderStatus = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.status = status;
    await provider.save();

    res.json({
      success: true,
      message: `Provider ${status === 'active' ? 'activated' : 'suspended'} successfully`
    });
  } catch (error) {
    console.error('Error updating provider status:', error);
    res.status(500).json({ message: 'Failed to update provider status' });
  }
};

export const getProviderStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      suspendedProviders
    ] = await Promise.all([
      User.countDocuments({ role: 'provider' }),
      User.countDocuments({ 
        role: 'provider',
        'verificationStatus.status': 'verified'
      }),
      User.countDocuments({
        role: 'provider',
        'verificationStatus.status': 'pending'
      }),
      User.countDocuments({
        role: 'provider',
        status: 'suspended'
      })
    ]);

    res.json({
      success: true,
      stats: {
        total: totalProviders,
        verified: verifiedProviders,
        pending: pendingVerifications,
        suspended: suspendedProviders
      }
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({ message: 'Failed to fetch provider statistics' });
  }
};
