import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import Admin from '../models/Admin.js';
import Counsellor from '../models/Counsellor.js';
import Beneficiary from '../models/Beneficiary.js';
import Activity from '../models/Activity.js';
import BeneficiaryDocument from '../models/BeneficiaryDocument.js';
import MasterData from '../models/MasterData.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../middleware/auditLogger.js';

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

export const runDatabaseBackup = async () => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    const [admins, counsellors, beneficiaries, activities, documents, masterData, auditLogs] = await Promise.all([
      Admin.findAll({ raw: true }),
      Counsellor.findAll({ raw: true }),
      Beneficiary.findAll({ raw: true }),
      Activity.findAll({ raw: true }),
      BeneficiaryDocument.findAll({ raw: true }),
      MasterData.findAll({ raw: true }),
      AuditLog.findAll({ raw: true }),
    ]);

    const backupPayload = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        admins,
        counsellors,
        beneficiaries,
        activities,
        documents,
        masterData,
        auditLogs
      }
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup_${dateStr}_${Date.now()}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`[BackupWorker] Backup successfully created at: ${filePath}`);

    // Log the backup as an audit event
    await logAudit({
      action: 'DATABASE_BACKUP',
      entity: 'System',
      details: { fileName, filePath, sizeBytes: fs.statSync(filePath).size }
    });

    return { success: true, filePath, fileName, data: backupPayload };
  } catch (err) {
    console.error('[BackupWorker] Failed to create database backup:', err.message);
    await logAudit({
      action: 'DATABASE_BACKUP',
      entity: 'System',
      status: 'FAILURE',
      details: { error: err.message }
    });
    throw err;
  }
};

// Schedule: Weekly on Sunday at 00:00 midnight
export const initBackupScheduler = () => {
  cron.schedule('0 0 * * 0', async () => {
    console.log('[BackupWorker] Running scheduled weekly database backup...');
    try {
      await runDatabaseBackup();
    } catch (e) {
      // Ignored since logged internally
    }
  });
  console.log('[BackupWorker] Scheduled weekly database backup initialized (Sundays at 00:00).');
};
