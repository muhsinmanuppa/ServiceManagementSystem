import express from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import {
  getClientProfile,
  updateClientProfile,
  getProviderProfile,
  updateProviderProfile
} from '../../controllers/profile/profile.controller.js';

const router = express.Router();

// Client profile routes
router.get('/client', authenticateUser, getClientProfile);
router.put('/client', authenticateUser, updateClientProfile);

// Provider profile routes
router.get('/provider', authenticateUser, getProviderProfile);
router.put('/provider', authenticateUser, updateProviderProfile);

export default router;
