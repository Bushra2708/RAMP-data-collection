import { Op } from 'sequelize';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all audit logs (Admin Only)
// @route   GET /api/audit
// @access  Private/Admin
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      action,
      userRole,
      status,
      startDate,
      endDate
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    // Search by userIdentifier, action, entityId, or IP
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { userIdentifier: { [Op.iLike]: `%${search}%` } },
        { action: { [Op.iLike]: `%${search}%` } },
        { entityId: { [Op.iLike]: `%${search}%` } },
        { ipAddress: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (action) {
      where.action = action;
    }

    if (userRole) {
      where.userRole = userRole;
    }

    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      success: true,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
      count: rows.length,
      logs: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
