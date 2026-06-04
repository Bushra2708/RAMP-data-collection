import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

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
  } catch (err) {
    console.error('Error during database bootstrap:', err.message);
  }
});

const app = express();

// Global Middlewares
app.use(cors());
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

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/beneficiary', beneficiaryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master-data', masterDataRoutes);

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
