import jwt from 'jsonwebtoken';
import Counsellor from '../models/Counsellor.js';
import Admin from '../models/Admin.js';
import { logAudit } from '../middleware/auditLogger.js';

// Helper: Generate JWT Token
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// Seed initial users if database is empty
export const seedInitialUsers = async () => {
  try {
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        fullName: 'ALEAP Head Office Admin',
        email: 'admin@aleap.org',
        password: 'admin123',
      });
      console.log('Seeded default admin: admin@aleap.org / admin123');
    }

    const counsellorCount = await Counsellor.count();
    if (counsellorCount === 0) {
      await Counsellor.create({
        fullName: 'Kiran Kumar',
        mobileNumber: '9999999999',
        password: 'counsellor123',
        district: 'Warangal',
        status: 'Active',
      });
      console.log('Seeded default counsellor: 9999999999 / counsellor123');
    }
  } catch (err) {
    console.error('Error seeding initial users:', err.message);
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const admin = await Admin.findOne({ where: { email: email.toLowerCase() } });
    if (!admin) {
      await logAudit({
        req,
        userIdentifier: email,
        userRole: 'System',
        action: 'LOGIN_FAILED',
        entity: 'Admin',
        status: 'FAILURE',
        details: { email, message: 'Admin user not found' }
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await logAudit({
        req,
        userId: admin.id,
        userIdentifier: admin.email,
        userRole: 'Admin',
        action: 'LOGIN_FAILED',
        entity: 'Admin',
        entityId: admin.id,
        status: 'FAILURE',
        details: { email: admin.email, message: 'Password mismatch' }
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await logAudit({
      req,
      userId: admin.id,
      userIdentifier: admin.email,
      userRole: 'Admin',
      action: 'LOGIN',
      entity: 'Admin',
      entityId: admin.id,
      details: { email: admin.email }
    });

    res.json({
      success: true,
      token: generateToken(admin.id, 'Admin'),
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: 'Admin',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Counsellor Login
// @route   POST /api/auth/counsellor/login
// @access  Public
export const counsellorLogin = async (req, res) => {
  const { mobileNumber, password } = req.body;
  if (!mobileNumber || !password) {
    return res.status(400).json({ success: false, message: 'Please provide mobile number and password' });
  }

  try {
    const counsellor = await Counsellor.findOne({ where: { mobileNumber } });
    if (!counsellor) {
      await logAudit({
        req,
        userIdentifier: mobileNumber,
        userRole: 'System',
        action: 'LOGIN_FAILED',
        entity: 'Counsellor',
        status: 'FAILURE',
        details: { mobileNumber, message: 'Counsellor not found' }
      });
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    if (counsellor.status !== 'Active') {
      await logAudit({
        req,
        userId: counsellor.id,
        userIdentifier: counsellor.mobileNumber,
        userRole: 'Counsellor',
        action: 'LOGIN_FAILED',
        entity: 'Counsellor',
        entityId: counsellor.id,
        status: 'FAILURE',
        details: { mobileNumber: counsellor.mobileNumber, message: 'Counsellor is inactive' }
      });
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact the administrator.' });
    }

    const isMatch = await counsellor.comparePassword(password);
    if (!isMatch) {
      await logAudit({
        req,
        userId: counsellor.id,
        userIdentifier: counsellor.mobileNumber,
        userRole: 'Counsellor',
        action: 'LOGIN_FAILED',
        entity: 'Counsellor',
        entityId: counsellor.id,
        status: 'FAILURE',
        details: { mobileNumber: counsellor.mobileNumber, message: 'Password mismatch' }
      });
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    await logAudit({
      req,
      userId: counsellor.id,
      userIdentifier: counsellor.mobileNumber,
      userRole: 'Counsellor',
      action: 'LOGIN',
      entity: 'Counsellor',
      entityId: counsellor.id,
      details: { mobileNumber: counsellor.mobileNumber }
    });

    res.json({
      success: true,
      token: generateToken(counsellor.id, 'Counsellor'),
      user: {
        id: counsellor.id,
        fullName: counsellor.fullName,
        mobileNumber: counsellor.mobileNumber,
        district: counsellor.district,
        role: 'Counsellor',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Request OTP for Password Reset (Counsellor)
// @route   POST /api/auth/counsellor/reset-otp
// @access  Public
export const requestResetOTP = async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ success: false, message: 'Please provide mobile number' });
  }

  try {
    const counsellor = await Counsellor.findOne({ where: { mobileNumber } });
    if (!counsellor) {
      return res.status(404).json({ success: false, message: 'Counsellor profile not found' });
    }

    // NOTE: In production, integrate an SMS gateway and do NOT return OTP in response.
    // For development, OTP is logged server-side only.
    const tempOTP = String(Math.floor(100000 + Math.random() * 900000));
    console.log(`[DEV ONLY] OTP for ${mobileNumber}: ${tempOTP}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to registered mobile number',
      // NEVER expose OTP in production response
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset password using OTP (Counsellor)
// @route   POST /api/auth/counsellor/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { mobileNumber, otp, newPassword } = req.body;
  if (!mobileNumber || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please fill all details' });
  }

  try {
    const counsellor = await Counsellor.findOne({ where: { mobileNumber } });
    if (!counsellor) {
      return res.status(404).json({ success: false, message: 'Counsellor not found' });
    }

    if (otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    counsellor.password = newPassword;
    await counsellor.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Register Counsellor (Admin Only)
// @route   POST /api/auth/counsellor/register
// @access  Private/Admin
export const registerCounsellor = async (req, res) => {
  const { fullName, mobileNumber, password, district } = req.body;
  if (!fullName || !mobileNumber || !password || !district) {
    return res.status(400).json({ success: false, message: 'Please provide all details' });
  }

  try {
    const exists = await Counsellor.findOne({ where: { mobileNumber } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Counsellor with this mobile number already exists' });
    }

    const counsellor = await Counsellor.create({
      fullName,
      mobileNumber,
      password,
      district,
      status: 'Active',
    });

    await logAudit({
      req,
      action: 'REGISTER_COUNSELLOR',
      entity: 'Counsellor',
      entityId: counsellor.id,
      details: { fullName, mobileNumber, district }
    });

    res.status(201).json({
      success: true,
      message: 'Counsellor registered successfully',
      counsellor: {
        id: counsellor.id,
        fullName: counsellor.fullName,
        mobileNumber: counsellor.mobileNumber,
        district: counsellor.district,
        status: counsellor.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Register Admin (Protected — existing Admin only)
// @route   POST /api/auth/admin/register
// @access  Private/Admin
export const registerAdmin = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all details' });
  }

  try {
    const exists = await Admin.findOne({ where: { email: email.toLowerCase() } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
    }

    const adminCount = await Admin.count();
    if (adminCount > 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authorized. First admin already created.' });
      }
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'Admin') {
          return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
        }
        req.user = { id: decoded.id };
        req.role = decoded.role;
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized. Token invalid.' });
      }
    }

    const admin = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      password,
    });

    await logAudit({
      req,
      action: 'REGISTER_ADMIN',
      entity: 'Admin',
      entityId: admin.id,
      details: { fullName, email: admin.email }
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Current Session User
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        role: req.role,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber,
        district: req.user.district,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all counsellors (Admin Only)
// @route   GET /api/auth/counsellors
// @access  Private/Admin
export const getCounsellors = async (req, res) => {
  try {
    const list = await Counsellor.findAll({
      attributes: { exclude: ['password'] },
      order: [['fullName', 'ASC']],
    });
    res.json({ success: true, count: list.length, counsellors: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update Counsellor (Admin Only)
// @route   PUT /api/auth/counsellors/:id
// @access  Private/Admin
export const updateCounsellor = async (req, res) => {
  try {
    const counsellor = await Counsellor.findByPk(req.params.id);
    if (!counsellor) {
      return res.status(404).json({ success: false, message: 'Counsellor not found' });
    }

    const { fullName, district, status, password } = req.body;
    if (fullName) counsellor.fullName = fullName;
    if (district) counsellor.district = district;
    if (status && ['Active', 'Inactive'].includes(status)) counsellor.status = status;
    if (password && password.trim() !== '') counsellor.password = password;

    await counsellor.save();

    await logAudit({
      req,
      action: 'UPDATE_COUNSELLOR',
      entity: 'Counsellor',
      entityId: counsellor.id,
      details: { fullName, district, status }
    });

    res.json({
      success: true,
      message: 'Counsellor updated successfully',
      counsellor: {
        id: counsellor.id,
        fullName: counsellor.fullName,
        mobileNumber: counsellor.mobileNumber,
        district: counsellor.district,
        status: counsellor.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Deactivate / Delete Counsellor (Admin Only)
// @route   DELETE /api/auth/counsellors/:id
// @access  Private/Admin
export const deleteCounsellor = async (req, res) => {
  try {
    const counsellor = await Counsellor.findByPk(req.params.id);
    if (!counsellor) {
      return res.status(404).json({ success: false, message: 'Counsellor not found' });
    }

    // Soft-deactivate rather than hard delete to preserve data integrity
    counsellor.status = 'Inactive';
    await counsellor.save();

    await logAudit({
      req,
      action: 'DEACTIVATE_COUNSELLOR',
      entity: 'Counsellor',
      entityId: counsellor.id,
      details: { status: 'Inactive' }
    });

    res.json({ success: true, message: 'Counsellor deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
