import express from 'express';
import { getMasterData, updateMasterData } from '../controllers/masterDataController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMasterData);
router.post('/:category', protect, adminOnly, updateMasterData);

export default router;
