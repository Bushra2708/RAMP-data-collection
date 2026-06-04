import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Check if Cloudinary is configured
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let upload;

if (useCloudinary) {
  // Use Cloudinary storage (production)
  const { cloudinaryUpload } = await import('../config/cloudinary.js');
  upload = cloudinaryUpload;
  console.log('Upload middleware: Using Cloudinary cloud storage.');
} else {
  // Fallback to local disk storage (development)
  const uploadDir = 'upload/';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: PDF, JPG, JPEG, PNG only.'), false);
    }
  };

  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });
  console.log('Upload middleware: Using local disk storage (set CLOUDINARY_* env vars for cloud).');
}

export default upload;
export { useCloudinary };
