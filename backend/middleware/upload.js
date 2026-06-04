import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

// Check if AWS S3 is configured
const useS3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_S3_BUCKET
);

// Check if Cloudinary is configured (fallback if S3 is not configured)
const useCloudinary = !useS3 && !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let upload;
let storageType = 'local';
let s3Client = null;

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Supported formats: PDF, JPG, JPEG, PNG only.'), false);
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB limit
};

if (useS3) {
  storageType = 's3';
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'documents/' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    }),
    fileFilter,
    limits,
  });
  console.log('Upload middleware: Using AWS S3 cloud storage.');
} else if (useCloudinary) {
  storageType = 'cloudinary';
  const { cloudinaryUpload } = await import('../config/cloudinary.js');
  upload = cloudinaryUpload;
  console.log('Upload middleware: Using Cloudinary cloud storage.');
} else {
  storageType = 'local';
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

  upload = multer({
    storage: storage,
    fileFilter,
    limits,
  });
  console.log('Upload middleware: Using local disk storage.');
}

export const deleteFile = async (publicId, filePath) => {
  try {
    if (storageType === 's3' && publicId) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: publicId,
      }));
      console.log(`Deleted file from S3: ${publicId}`);
    } else if (storageType === 'cloudinary' && publicId) {
      const cloudinary = (await import('../config/cloudinary.js')).default;
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted file from Cloudinary: ${publicId}`);
    } else if (filePath) {
      let localPath = filePath;
      if (localPath.startsWith('/upload')) {
        localPath = localPath.substring(1);
      }
      const absolutePath = path.resolve(process.cwd(), localPath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted local file: ${absolutePath}`);
      } else {
        console.log(`Local file not found for deletion: ${absolutePath}`);
      }
    }
  } catch (err) {
    console.error(`Failed to delete file from storage:`, err.message);
  }
};

export default upload;
export { storageType, useCloudinary };
