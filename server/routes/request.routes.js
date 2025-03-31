import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadAttachments } from '../middleware/upload.middleware.js';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  addMessageToRequest,
  getProviderRequests,
  updateProviderRequestStatus
} from '../controllers/request.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Client routes
router.post('/', uploadAttachments.array('attachments', 5), createRequest);
router.get('/user', getRequests);
router.get('/detail/:id', getRequestById);

// Update request status (provider only)
router.put('/:requestId/status', updateRequestStatus);

// Add a message to an existing request
router.post('/:requestId/message', addMessageToRequest);

// Provider routes - add specific endpoint for provider requests
router.get('/provider/list', authorizeRoles(['provider']), getProviderRequests);

router.patch(
  '/provider/requests/:requestId', 
  authorizeRoles(['provider']), 
  updateProviderRequestStatus
);

export default router;
