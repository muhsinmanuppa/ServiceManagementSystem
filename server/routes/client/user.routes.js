import express from 'express';
import { 
  updateProfile, 
  getUserProfile,
  changePassword
} from '../../controllers/user.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { uploadDocs } from '../../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Add debug logging middleware
router.use((req, res, next) => {
  if (req.path.includes('/profile')) {
    console.log('Profile request:', {
      method: req.method,
      body: req.body,
      userId: req.user?._id
    });
  }
  next();
});

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;
