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
  updateCounsellor,
  deleteCounsellor,
  getAdmins,
  updateAdmin,
  resetCounsellorPassword,
  resetAdminPassword,
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/admin/register', registerAdmin);
router.post('/counsellor/login', counsellorLogin);
router.post('/counsellor/reset-otp', requestResetOTP);
router.post('/counsellor/reset-password', resetPassword);
router.post('/counsellor/register', protect, adminOnly, registerCounsellor);
router.get('/me', protect, getMe);
router.get('/counsellors', protect, adminOnly, getCounsellors);
router.put('/counsellors/:id', protect, adminOnly, updateCounsellor);
router.delete('/counsellors/:id', protect, adminOnly, deleteCounsellor);
router.post('/counsellors/:id/reset-password', protect, adminOnly, resetCounsellorPassword);
router.get('/admins', protect, adminOnly, getAdmins);
router.put('/admins/:id', protect, adminOnly, updateAdmin);
router.post('/admins/:id/reset-password', protect, adminOnly, resetAdminPassword);

export default router;

