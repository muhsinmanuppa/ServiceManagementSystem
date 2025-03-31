import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow both images and documents for verification
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/i;
  const extension = file.originalname.split('.').pop().toLowerCase();
  
  if (!allowedTypes.test(extension)) {
    return cb(new Error('Only images, PDF and Word documents are allowed!'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max-limit
    files: 5 // Maximum 5 files
  }
});
