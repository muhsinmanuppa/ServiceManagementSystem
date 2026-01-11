import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Configure admin details
    const adminData = {
      name: 'Admin User',
      email: 'superAdmin@service.com',
      password: 'Admin@123456', // CHANGE THIS PASSWORD
      role: 'admin',
      isEmailVerified: true,
      status: 'active',
      verificationStatus: {
        status: 'verified'
      }
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Delete it first or use update script.');
      process.exit(1);
    }

    // Create new admin - password will be hashed by pre-save hook
    const admin = new User(adminData);
    await admin.save();
    
    console.log('✅ Admin created successfully!\n');
    console.log('==========================================');
    console.log('Name:', adminData.name);
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', adminData.role);
    console.log('Status:', adminData.status);
    console.log('Email Verified:', adminData.isEmailVerified);
    console.log('==========================================');
    console.log('\n⚠️  SAVE THESE CREDENTIALS SECURELY!\n');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('Email already exists in database');
    }
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createAdmin();


// node scripts/createAdmin.js
// to run this script