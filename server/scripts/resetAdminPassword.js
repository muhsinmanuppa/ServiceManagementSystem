import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');
    
    const adminEmail = 'superAdmin@service.com';
    const newPassword = 'Admin@123456'; // Change this to your desired password
    
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    console.log('Found admin user:', admin.email);
    console.log('Current role:', admin.role);
    
    // Set new password - the pre-save hook will hash it
    admin.password = newPassword;
    await admin.save();
    
    console.log('✅ Admin password reset successfully!');
    console.log('==========================================');
    console.log('Email:', adminEmail);
    console.log('New Password:', newPassword);
    console.log('==========================================');
    console.log('⚠️  Save these credentials securely!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();