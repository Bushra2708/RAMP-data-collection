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

// Connect to Database and Bootstrap tables/seeding
connectDB().then(async () => {
  try {
    // Sync database tables with defined schemas
    await sequelize.sync({ alter: true });
    console.log('PostgreSQL database synced successfully.');

    // Proactively seed initial database parameters once connected
    const { seedInitialUsers } = await import('./controllers/authController.js');
    const { seedInitialMasterData } = await import('./controllers/masterDataController.js');
    await seedInitialUsers();
    await seedInitialMasterData();

    // Start weekly backup scheduler
    initBackupScheduler();
  } catch (err) {
    console.error('Error during database bootstrap:', err.message);
  }
});

const app = express();

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
  'https://ramp-data-collection.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

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
app.listen(PORT, () => {
  console.log(`Server executing in development on port ${PORT}`);
});
