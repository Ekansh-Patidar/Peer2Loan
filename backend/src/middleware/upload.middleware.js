const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');
const { FILE_UPLOAD } = require('../config/constants');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    FILE_UPLOAD.PAYMENT_PROOF_PATH,
    FILE_UPLOAD.PAYOUT_PROOF_PATH,
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = FILE_UPLOAD.PAYMENT_PROOF_PATH;
    
    // Determine upload path based on field name
    if (file.fieldname === 'payoutProof') {
      uploadPath = FILE_UPLOAD.PAYOUT_PROOF_PATH;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `File size too large. Maximum size: ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
            )
          );
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `File size too large. Maximum size: ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
            )
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ApiError.badRequest(`Too many files. Maximum: ${maxCount}`));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Helper to delete file
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
};