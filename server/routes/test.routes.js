import express from 'express';
import { uploadImage, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

// Test route to verify multer setup
router.post('/upload-image', uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
}, handleUploadError);

// Simple ping endpoint for checking API connectivity
router.get('/ping', (req, res) => {
  res.json({
    status: 'success',
    message: 'API server is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.post('/echo', (req, res) => {
  res.json({
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

export default router;
