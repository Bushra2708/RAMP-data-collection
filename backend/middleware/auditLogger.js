import AuditLog from '../models/AuditLog.js';

/**
 * logAudit — Write an audit log entry asynchronously.
 * Failures are swallowed so they never break business logic.
 */
export const logAudit = async ({
  req = null,
  userId = null,
  userIdentifier = null,
  userRole = 'System',
  action,
  entity = null,
  entityId = null,
  details = {},
  status = 'SUCCESS',
}) => {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
      : 'system';

    // Hydrate from req.user if not explicitly provided
    if (req?.user && !userId) {
      userId = req.user.id;
    }
    if (req?.user && !userIdentifier) {
      userIdentifier = req.user.email || req.user.mobileNumber || null;
    }
    if (req?.role && !userRole) {
      userRole = req.role;
    }

    await AuditLog.create({
      userId,
      userIdentifier,
      userRole,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details,
      ipAddress,
      status,
    });
  } catch (err) {
    // Never crash the main request because of audit failure
    console.error('[AuditLogger] Failed to write audit log:', err.message);
  }
};
