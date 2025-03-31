import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';
import { uploadDocs } from '../../middleware/upload.middleware.js';
import { 
  createService, 
  updateService, 
  deleteService,
  getProviderServices,
  getServiceById
} from '../../controllers/provider/service.controller.js';

const router = express.Router();

// Apply auth middleware to all provider routes
router.use(authenticateUser);
router.use(authorizeRoles('provider'));

// Service routes - using cloudinary upload
router.get('/', getProviderServices);
router.get('/:serviceId', getServiceById);
router.post('/', uploadDocs.single('serviceImage'), createService);
router.put('/:serviceId', uploadDocs.single('serviceImage'), updateService);
router.delete('/:serviceId', deleteService);

export default router;
