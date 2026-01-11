import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      from: process.env.SMTP_FROM
    };

    // Validate configuration
    const requiredVars = ['host', 'port', 'auth.user', 'auth.pass'];
    const missing = requiredVars.filter(path => {
      const value = path.split('.').reduce((obj, key) => obj?.[key], config);
      return !value;
    });

    if (missing.length > 0) {
      console.error('Missing SMTP configuration:', missing.join(', '));
      console.error('Current config:', {
        host: config.host || 'missing',
        port: config.port || 'missing',
        user: config.auth.user || 'missing',
        secure: config.secure
      });
      throw new Error('Email configuration incomplete');
    }

    // Create transporter with detailed logging
    console.log('Setting up email transport with:', {
      host: config.host,
      port: config.port,
      secure: config.secure
    });

    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw error;
  }
};

// Send email with robust error handling
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    // Log before sending
    console.log(`Attempting to send email to: ${to}`);
    
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Service Management'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || 'This is a system generated email. Please view in an HTML compatible email client.',
      html
    });
    
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Generate OTP email content
const sendOtpEmail = async (email, otp) => {
  try {
    const subject = 'Email Verification OTP';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4A90E2;">Email Verification</h2>
        <p>Thank you for registering with our service. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>The OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
        <p>Regards,<br>Service Management Team</p>
      </div>
    `;
    
    return await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    throw error;
  }
};

// Add the missing function for sending verification email
const sendVerificationEmail = async (user) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${user.verificationToken}`;
    
    const subject = 'Email Verification';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4A90E2;">Verify Your Email</h2>
        <p>Thank you for registering with our service. Please click the button below to verify your email address:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste the following link in your browser:</p>
        <p style="word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Regards,<br>Service Management Team</p>
      </div>
    `;
    
    return await sendEmail({ to: user.email, subject, html });
  } catch (error) {
    console.error(`Failed to send verification email to ${user.email}:`, error);
    throw error;
  }
};

// Add the missing function for sending password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4A90E2;">Reset Your Password</h2>
        <p>You requested to reset your password. Please click the button below to create a new password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste the following link in your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
        <p>Regards,<br>Service Management Team</p>
      </div>
    `;
    
    return await sendEmail({ to: user.email, subject, html });
  } catch (error) {
    console.error(`Failed to send password reset email to ${user.email}:`, error);
    throw error;
  }
};

// Add the missing function for sending verification status email
const sendVerificationStatusEmail = async (email, status, remarks) => {
  try {
    const subject = `Provider Verification ${status === 'verified' ? 'Approved' : 'Rejected'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${status === 'verified' ? '#28a745' : '#dc3545'}">
          Verification ${status === 'verified' ? 'Approved' : 'Rejected'}
        </h2>
        <p>Your service provider verification has been ${status}.</p>
        ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
        ${status === 'verified' 
          ? '<p>You can now start offering services through our platform.</p>'
          : '<p>You may reapply after addressing the issues mentioned above.</p>'
        }
        <p>Best regards,<br>Service Management Team</p>
      </div>
    `;
    
    return await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error('Error sending verification status email:', error);
    throw error;
  }
};

// Add or update any email template functions that include currency values
// For example, when sending payment confirmation emails or booking receipts,
// ensure the currency symbol is ₹ instead of $

// Use ES module exports instead of CommonJS
export {
  sendEmail,
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationStatusEmail
};
