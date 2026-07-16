const jwt = require('jsonwebtoken');

const verifyPlatformAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.PLATFORM_ADMIN_JWT_SECRET);
    if (decoded.scope !== 'platform-admin') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.platformAdmin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyPlatformAdminToken };
