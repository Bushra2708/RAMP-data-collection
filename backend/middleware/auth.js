import jwt from 'jsonwebtoken';
import Counsellor from '../models/Counsellor.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'telangana_ramp_rbhms_jwt_secret_key_2026');
    
    if (decoded.role === 'Admin') {
      req.user = await Admin.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      req.role = 'Admin';
    } else {
      req.user = await Counsellor.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      req.role = 'Counsellor';
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found, authentication failed' });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Token failed or expired' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Administrators only' });
  }
};
