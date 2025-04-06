import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get absolute upload path
const getUploadBasePath = () => {
  // Use /tmp directory for Vercel or similar environments
  if (process.env.VERCEL) {
    return '/tmp';
  }
  // For local development, use project root
  return path.join(__dirname, '..', '..', 'uploads');
};

// Ensure upload directories exist
const createUploadDirs = () => {
  const baseUploadPath = getUploadBasePath();
  const dirs = ['images', 'documents', 'attachments'];
  
  try {
    // First ensure base upload directory exists
    if (!fs.existsSync(baseUploadPath)) {
      fs.mkdirSync(baseUploadPath, { recursive: true });
    }

    // Then create subdirectories
    dirs.forEach(dir => {
      const dirPath = path.join(baseUploadPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  } catch (error) {
    console.error('Error creating upload directories:', error);
    // Don't throw error - let the application continue
  }
};

// Helper function to get temp upload path
const getTempUploadPath = (type) => {
  return path.join(getUploadBasePath(), type);
};

createUploadDirs();

// Configure storage for Vercel compatibility
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = getTempUploadPath('images');
    } else if (file.fieldname === 'documents') {
      uploadPath = getTempUploadPath('documents');
    } else {
      uploadPath = getTempUploadPath('attachments');
    }
    
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif/i;
  const allowedDocTypes = /pdf|doc|docx|txt|rtf/i;
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'image' && !allowedImageTypes.test(fileExt)) {
    cb(new Error('Only image files are allowed!'), false);
  } else if (file.fieldname === 'documents' && !allowedDocTypes.test(fileExt)) {
    cb(new Error('Invalid document type!'), false);
  } else {
    cb(null, true);
  }
};

// Add this after existing imports
const memoryStorage = multer.memoryStorage();

// Replace existing imageUpload configuration with this:
const imageUpload = multer({ 
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const documentUpload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const attachmentsUpload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

// Export configured multer instances
export const uploadImage = imageUpload;
export const uploadDocument = documentUpload;
export const uploadAttachments = attachmentsUpload;

// Handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: 'File upload error', 
      error: err.message 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  
  next();
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'provider-verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto'
  }
});

// Configure multer for provider verification
export const verificationUpload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/i;
    const extname = file.originalname.toLowerCase().match(/\.([^.]+)$/)?.[1];
    
    if (!extname || !allowedTypes.test(extname)) {
      return cb(new Error('Invalid file type. Only images, PDF and Word documents are allowed.'));
    }
    cb(null, true);
  }
}).single('document');

// Configure multer for memory storage
export const uploadDocs = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow pdf, images, and common document formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'));
    }
  }
});
