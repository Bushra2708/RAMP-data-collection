import fs from 'fs';
import path from 'path';
import { runDatabaseBackup } from '../config/backupWorker.js';
import { logAudit } from '../middleware/auditLogger.js';

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

// @desc    Trigger a manual database backup
// @route   POST /api/backup/trigger
// @access  Private/Admin
export const triggerBackup = async (req, res) => {
  try {
    const result = await runDatabaseBackup();
    
    await logAudit({
      req,
      action: 'MANUAL_BACKUP_TRIGGER',
      entity: 'System',
      details: { fileName: result.fileName }
    });

    res.json({
      success: true,
      message: 'Database backup created successfully.',
      fileName: result.fileName,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    List all database backups
// @route   GET /api/backup/list
// @access  Private/Admin
export const listBackups = async (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          sizeBytes: stats.size,
          createdAt: stats.birthtime || stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, backups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Download a specific backup file
// @route   GET /api/backup/download/:fileName
// @access  Private/Admin
export const downloadBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Security check to prevent path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid file name.' });
    }

    const filePath = path.join(BACKUPS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found.' });
    }

    await logAudit({
      req,
      action: 'DOWNLOAD_BACKUP',
      entity: 'System',
      details: { fileName }
    });

    res.download(filePath, fileName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
