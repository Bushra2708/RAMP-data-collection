import express from 'express';
import { getReportData } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/:reportType', protect, adminOnly, getReportData);

export default router;
