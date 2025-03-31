import express from 'express';
import { 
  register, 
  login, 
  verifyEmail,
  sendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile,
  sendOtp,
  resendOtp,
  verifyOtp,
  validateToken
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/send-verification', sendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-otp', sendOtp);
router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/validate-token', validateToken);

// Protected routes - require authentication
router.use(authenticateUser);

router.put('/change-password', changePassword);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);

export default router;
