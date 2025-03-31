import User from '../../models/User.js';

export const getClientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationToken -resetPasswordToken');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

export const updateClientProfile = async (req, res) => {
  try {
    
    const { name, phone, bio, address } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { 
        new: true,
        select: '-password -verificationToken -resetPasswordToken'
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

export const getProviderProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationToken -resetPasswordToken');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

export const updateProviderProfile = async (req, res) => {
  try {
    const { name, phone, bio, address, businessName, experience } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (address !== undefined) updates.address = address;
    if (businessName !== undefined) updates.businessName = businessName;
    if (experience !== undefined) updates.experience = experience;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { 
        new: true,
        select: '-password -verificationToken -resetPasswordToken'
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Error updating profile'
    });
  }
};
