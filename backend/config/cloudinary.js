import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Custom multer storage engine that uploads files directly to Cloudinary v2
 * using the upload_stream API. No multer-storage-cloudinary package needed.
 */
const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rbhms_documents',
        resource_type: 'auto', // handles images AND PDFs/raw files
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed:', error);
          return cb(error);
        }
        console.log('Cloudinary upload result:', {
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type,
          original_filename: result.original_filename,
        });
        cb(null, {
          path: result.secure_url,      // full Cloudinary HTTPS URL
          filename: result.public_id,  // public_id used for deletion
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: result.bytes,
          original_filename: result.original_filename,
          format: result.format,
          resource_type: result.resource_type,
        });
      }
    );

    const readable = file.stream ? file.stream : Readable.from(file.buffer);
    readable.pipe(uploadStream).on('error', (streamError) => {
      console.error('Cloudinary upload stream error:', streamError);
      cb(streamError);
    });
  },

  _removeFile(req, file, cb) {
    // Delete file from Cloudinary using the stored public_id
    cloudinary.uploader.destroy(file.filename, cb);
  },
};

const cloudinaryUpload = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: PDF, JPG, JPEG, PNG only.'), false);
    }
  },
});

export { cloudinary, cloudinaryUpload };
export default cloudinary;
