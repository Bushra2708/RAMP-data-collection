import express from 'express';
import { triggerBackup, listBackups, downloadBackup } from '../controllers/backupController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/trigger', protect, adminOnly, triggerBackup);
router.get('/list', protect, adminOnly, listBackups);
router.get('/download/:fileName', protect, adminOnly, downloadBackup);

export default router;
