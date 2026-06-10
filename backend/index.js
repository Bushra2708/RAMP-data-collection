import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environmental variables
dotenv.config();

// Import Sequelize and connection helper
import sequelize, { connectDB } from './config/db.js';

// Import Models to register them with Sequelize before syncing
import './models/Admin.js';
import './models/Counsellor.js';
import './models/MasterData.js';
import './models/Beneficiary.js';
import './models/Activity.js';
import './models/BeneficiaryDocument.js';
import './models/AuditLog.js';
import { initBackupScheduler } from './config/backupWorker.js';

const app = express();
app.set('trust proxy', 1);

// Security Hardening Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  'https://ramp-data-collection.vercel.app'
].filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files statically
app.use('/upload', express.static(path.join(process.cwd(), 'upload')));

// Import Routes
import authRoutes from './routes/authRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import masterDataRoutes from './routes/masterDataRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import backupRoutes from './routes/backupRoutes.js';

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/beneficiary', beneficiaryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);

// Root Status check
app.get('/api/status', (req, res) => {
  res.json({ success: true, message: 'Telangana RBHMS API is active.' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('PostgreSQL database synced successfully.');

    const { seedInitialUsers } = await import('./controllers/authController.js');
    const { seedInitialMasterData } = await import('./controllers/masterDataController.js');
    await seedInitialUsers();
    await seedInitialMasterData();
    initBackupScheduler();

    const server = app.listen(PORT);

    server.on('listening', () => {
      console.log(`Server executing in development on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other backend process or set a different PORT in .env`);
      } else {
        console.error('Server failed to start:', err.message);
      }
      process.exit(1);
    });

    const shutdown = () => {
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Error during database bootstrap:', err.message);
    if (err.original?.code === 'ETIMEDOUT' || err.name === 'SequelizeConnectionError') {
      console.error('Database connection timed out. Check your internet connection and DATABASE_URL in backend/.env');
      console.error('Neon databases may need a moment to wake up — save any file to let nodemon retry.');
    }
    process.exit(1);
  }
};

startServer();
