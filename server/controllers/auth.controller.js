import User from "../models/User.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendVerificationEmail as sendVerificationEmailUtil,
  sendPasswordResetEmail,
  sendOtpEmail,
} from "../utils/emailUtils.js";

// generate OTP
const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// User registration
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("Starting registration for:", email);

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate OTP first
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with OTP and role-based status
    const user = new User({
      name,
      email,
      password,
      role: role || "client",
      isEmailVerified: false,
      status: "active",
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry,
      verificationStatus: {
        status: role === "provider" ? "pending" : "verified",
      },
    });

    await user.save();
    console.log("User saved successfully:", user._id);

    // Send OTP email
    try {
      await sendOtpEmail(email, otp);
      console.log("OTP email sent to:", email);

      return res.status(201).json({
        success: true,
        message:
          "Registration successful. Please check your email for verification code.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.status(201).json({
        success: true,
        message:
          "Registration successful but verification email could not be sent.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        emailSent: false,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// User login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Add validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password",
      });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials user",
        detail: "User not found",
      });
    }

    // Debug log in development
    if (process.env.NODE_ENV === "development") {
      console.log("Login attempt for user:", {
        id: user._id,
        email: user.email,
        hasPassword: !!user.password,
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials pass",
        detail: "Password mismatch",
      });
    }

    const isActive = user.status === "active";
    if (!isActive) {
      return res.status(401).json({
        message: "Contact support to activate your account",
        detail: "Account inactive",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// determine redirect path
const getRedirectPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "provider":
      return "/provider";
    case "client":
      return "/client";
    default:
      return "/";
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    // Mark user as verified and remove verification token
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error during email verification" });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new verification token if necessary
    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(20).toString("hex");
      await user.save();
    }

    // Send verification email
    await sendVerificationEmailUtil(user);

    res.json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Send verification email error:", error);
    res
      .status(500)
      .json({ message: "Server error while sending verification email" });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      message: "Password reset email sent. Please check your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

// Change password (logged in users)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from db with pasword field
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password is correct using argon2
    const isMatch = await argon2.verify(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error while changing password" });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -verificationToken -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error fetching user details" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;

    // Fields that can be updated
    const updateFields = {
      name: name || undefined,
      phone: phone !== undefined ? phone : undefined,
      bio: bio !== undefined ? bio : undefined,
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    // Additional check for empty object
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    console.log("Updating user profile with fields:", updateFields);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select(
      "-password -verificationToken -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Server error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    await sendVerificationEmailUtil(user);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add or modify the send-otp endpoint
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Save OTP to user's document
    user.verificationOtp = otp;
    user.verificationOtpExpiry = otpExpiry;
    await user.save();

    // Log the OTP in development mode
    if (process.env.NODE_ENV === "development") {
      console.log(`OTP for ${email}: ${otp}`);
    }

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

// Add or modify the resend-otp endpoint
export const resendOtp = async (req, res) => {
  try {
    // Call the same function as sendOtp
    await exports.sendOtp(req, res);
  } catch (error) {
    console.error("Resend OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to resend OTP", error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({
      email,
      verificationOtp: otp,
      verificationOtpExpiry: { $gt: new Date() }, 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpiry = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to verify OTP", error: error.message });
  }
};

export const validateToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ valid: true, user });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ message: "Server error validating token" });
  }
};
