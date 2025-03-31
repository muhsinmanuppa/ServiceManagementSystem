import express from 'express';
import { uploadImage } from '../../middleware/upload.middleware.js';
import { 
  getAllServices,
  getServiceById,
  getFeaturedServices,
  searchServices,
  getServiceCalendar
} from '../../controllers/client/service.controller.js';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getAllServices);
router.get('/featured', getFeaturedServices);
router.get('/search', searchServices);
router.get('/:id', getServiceById);
router.get('/:serviceId/calendar', getServiceCalendar);



export default router;
