import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../controllers/admin/category.controller.js';

const router = express.Router();

// Ensure all routes are protected and only accessible by admins
router.use(authenticateUser, authorizeRoles(['admin']));

// Fix routes by removing categories from path since it's already in the base URL
router.get('/', getAllCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
