import express from 'express';
import {
  registerBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  addActivity,
  uploadDocument,
  deleteDocument,
  importBeneficiaries,
  getImportTemplate,
} from '../controllers/beneficiaryController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/import/template', protect, adminOnly, getImportTemplate);
router.post('/import', protect, adminOnly, importBeneficiaries);

router.route('/')
  .post(protect, registerBeneficiary)
  .get(protect, getBeneficiaries);

router.route('/:id')
  .get(protect, getBeneficiaryById)
  .put(protect, updateBeneficiary);

router.post('/:id/activity', protect, addActivity);
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('UPLOAD MIDDLEWARE ERROR:', err);
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
};

router.post('/:id/upload', protect, handleUploadMiddleware, uploadDocument);
router.delete('/:id/document/:docId', protect, adminOnly, deleteDocument);

export default router;
