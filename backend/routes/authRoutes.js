import express from 'express';
import {
  adminLogin,
  registerAdmin,
  counsellorLogin,
  requestResetOTP,
  resetPassword,
  registerCounsellor,
  getMe,
  getCounsellors,
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/admin/register', registerAdmin);
router.post('/counsellor/login', counsellorLogin);
router.post('/counsellor/reset-otp', requestResetOTP);
router.post('/counsellor/reset-password', resetPassword);
router.post('/counsellor/register', registerCounsellor);
router.get('/me', protect, getMe);
router.get('/counsellors', protect, adminOnly, getCounsellors);

export default router;

