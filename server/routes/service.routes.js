import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getFeaturedServices
} from '../controllers/service.controller.js';

const router = express.Router();

// Public route for fetching featured services with debug logging
router.get('/featured', (req, res, next) => {
  console.log('Featured services route accessed');
  getFeaturedServices(req, res).catch(next);
});

// Public route for fetching all services
router.get('/', getAllServices);

// Protected routes
router.get('/:id', authenticateUser, getServiceById);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(['provider']),
  uploadImage.single('image'),
  createService
);
router.put(
  '/:id',
  authenticateUser,
  authorizeRoles(['provider']),
  uploadImage.single('image'),
  updateService
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(['provider']),
  deleteService
);

export default router;