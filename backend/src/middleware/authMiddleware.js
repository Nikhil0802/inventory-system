const jwt = require('jsonwebtoken');

const PERMISSIONS = {
  'view:inventory':       ['owner', 'admin', 'manager', 'reporter', 'reader'],
  'manage:inventory':     ['owner', 'admin', 'manager'],
  'view:transactions':    ['owner', 'admin', 'manager', 'reporter'],
  'create:transactions':  ['owner', 'admin', 'manager'],
  'view:expenses':        ['owner', 'admin', 'reporter'],
  'manage:expenses':      ['owner', 'admin'],
  'view:profit':          ['owner', 'admin', 'reporter'],
  'export:reports':       ['owner', 'admin', 'reporter'],
  'manage:users':         ['owner', 'admin'],
  'manage:org':           ['owner'],
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const checkPermission = (permission) => (req, res, next) => {
  const allowed = PERMISSIONS[permission] || [];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

// Legacy — kept for backward compat with any existing route that uses it directly
const checkRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

module.exports = { verifyToken, checkPermission, checkRole, PERMISSIONS };
