import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage for all uploads
const memoryStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif/i;
  const allowedDocTypes = /pdf|doc|docx|txt|rtf/i;
  
  if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed!'), false);
  } else if (file.fieldname === 'documents' && !allowedDocTypes.test(file.mimetype)) {
    cb(new Error('Invalid document type!'), false);
  } else {
    cb(null, true);
  }
};

// Configure multer instances with memory storage
export const uploadImage = multer({ 
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const uploadDocument = multer({ 
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const uploadAttachments = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

// Create the base multer instance for document uploads
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
      'image/gif',
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

// Update the service image upload configuration
export const uploadServiceImage = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, GIF, and WebP files allowed"), false);
    }
    cb(null, true);
  },
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single("image"); // Changed to 'image' to match the frontend

// Configure multer for provider verification
export const verificationUpload = multer({
  storage: memoryStorage,
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

// Handle file upload to Cloudinary
export const handleFileUpload = async (file, folder = 'services') => {
  try {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'auto'
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
};

// CORS middleware for Vercel
export const configureCors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

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
        success: false,
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

// Helper function to handle multiple file uploads to Cloudinary
export const handleMultipleFileUploads = async (files, folder = 'attachments') => {
  try {
    const uploadPromises = files.map(file => handleFileUpload(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple file upload error:', error);
    throw new Error('Failed to upload one or more files');
  }
};

// Export middleware for multiple file uploads
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: maxCount }
  }).array(fieldName, maxCount);
};