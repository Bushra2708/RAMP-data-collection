import express from 'express';
import {
  registerBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  addActivity,
  uploadDocument,
  deleteDocument,
} from '../controllers/beneficiaryController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .post(protect, registerBeneficiary)
  .get(protect, getBeneficiaries);

router.route('/:id')
  .get(protect, getBeneficiaryById)
  .put(protect, updateBeneficiary);

router.post('/:id/activity', protect, addActivity);
router.post('/:id/upload', protect, upload.single('file'), uploadDocument);
router.delete('/:id/document/:docId', protect, adminOnly, deleteDocument);

export default router;
