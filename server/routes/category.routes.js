import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';

const router = express.Router();

// Public route for fetching categories - accessible without auth
router.get('/', getAllCategories);

// Admin routes - Fix the paths by removing /admin prefix
router.post(
  '/',  // Changed from '/admin/categories'
  authenticateUser,
  authorizeRoles(['admin']),
  uploadImage.single('image'),
  createCategory
);

router.put(
  '/:id',  // Changed from '/admin/categories/:id'
  authenticateUser,
  authorizeRoles(['admin']),
  uploadImage.single('image'),
  updateCategory
);

router.delete(
  '/:id',  // Changed from '/admin/categories/:id'
  authenticateUser,
  authorizeRoles(['admin']),
  deleteCategory
);

export default router;
