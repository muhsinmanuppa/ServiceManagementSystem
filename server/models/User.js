import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false 
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationOtp: String,
  verificationOtpExpiry: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Provider specific fields
  description: {
    type: String,
    trim: true
  },

  document: {
    url: String,
    publicId: String,
    originalName: String,
    format: String,
    uploadedAt: Date
  },


  // Verification details
  verificationStatus: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    remarks: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  businessName: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0
  }

}, {
  timestamps: true
});

// Remove sensitive information when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationOtp;
  delete obj.verificationOtpExpiry;
  return obj;
};

// Password comparison
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!this.password || !enteredPassword) {
      console.error('Missing password for comparison');
      return false;
    }
    const isMatch = await argon2.verify(this.password, enteredPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Hash password before saving
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }

    const hashedPassword = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 15360,
      timeCost: 2
    });
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
