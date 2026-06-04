import jwt from 'jsonwebtoken';
import Counsellor from '../models/Counsellor.js';
import Admin from '../models/Admin.js';

// Helper: Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'telangana_ramp_rbhms_jwt_secret_key_2026', {
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
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(admin._id, 'Admin'),
      user: {
        id: admin._id,
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
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    if (counsellor.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const isMatch = await counsellor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    res.json({
      success: true,
      token: generateToken(counsellor._id, 'Counsellor'),
      user: {
        id: counsellor._id,
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

    const tempOTP = String(Math.floor(100000 + Math.random() * 900000));
    
    res.json({
      success: true,
      message: 'OTP sent successfully to registered mobile number',
      otp: tempOTP,
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
      return res.status(400).json({ success: false, message: 'Invalid OTP length' });
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
    });

    res.status(201).json({
      success: true,
      message: 'Counsellor registered successfully',
      counsellor: {
        id: counsellor._id,
        fullName: counsellor.fullName,
        mobileNumber: counsellor.mobileNumber,
        district: counsellor.district,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Register Admin
// @route   POST /api/auth/admin/register
// @access  Public
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

    const admin = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Current Session
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
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
