import express from 'express';
import { authenticateUser, authorizeRoles } from '../../middleware/auth.middleware.js';
import { uploadDocs, handleUploadError } from '../../middleware/upload.middleware.js';
import { 
  createService, 
  updateService, 
  deleteService,
  getProviderServices,
  getServiceById
} from '../../controllers/provider/service.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('provider'));

router.get('/', getProviderServices);
router.get('/:id', getServiceById);
router.post('/', uploadDocs.single('serviceImage'), handleUploadError, createService);
router.put('/:id', uploadDocs.single('serviceImage'), handleUploadError, updateService);
router.delete('/:id', deleteService);

export default router;