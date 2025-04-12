import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadServiceImage, handleFileUpload } from '../middleware/upload.middleware.js';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getFeaturedServices,
  searchServices
} from '../controllers/service.controller.js';

const router = express.Router();

// Route for searching services
router.get('/search', searchServices);

// Public route for fetching all services
router.get('/', getAllServices);

// Public route for fetching featured services with debug logging
router.get('/featured', (req, res, next) => {
  console.log('Featured services route accessed');
  getFeaturedServices(req, res).catch(next);
});

// Protected routes
router.get('/:id', authenticateUser, getServiceById);
router.post(
  '/',
  authenticateUser,
  authorizeRoles(['provider']),
  uploadServiceImage,
  createService
);
router.put(
  '/:id',
  authenticateUser,
  authorizeRoles(['provider']),
  uploadServiceImage,
  updateService
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles(['provider']),
  deleteService
);

// Route for uploading service images
router.post('/upload', uploadServiceImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const result = await handleFileUpload(req.file, 'services');
    res.json({ 
      imageUrl: result.url,
      publicId: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

export default router;