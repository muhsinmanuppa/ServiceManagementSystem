import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { 
  getProfile, 
  updateProfile, 
  updatePassword 
} from '../controllers/profile.controller.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', updatePassword);

export default router;
