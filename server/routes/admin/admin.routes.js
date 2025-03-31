import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';

import { 
  getPendingVerifications,
  getProviderDetails,
  handleVerification,
  getAllProviders,
  updateProviderStatus,
  getProviderStats 
} from '../../controllers/admin/admin.controller.js';
import { getAdminStats } from '../../controllers/admin/stats.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// Fix provider routes
router.get('/providers/list', getAllProviders);
router.get('/providers/stats', getProviderStats);
router.get('/providers/:providerId', getProviderDetails);
router.put('/providers/:providerId/status', updateProviderStatus);

// Verification routes
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:providerId/handle', handleVerification);

// Admin stats route
router.get('/stats', getAdminStats);

export default router;
