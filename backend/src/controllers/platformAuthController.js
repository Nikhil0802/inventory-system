const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');

function generateAccessToken(admin) {
  return jwt.sign(
    { adminId: admin.id, email: admin.email, scope: 'platform-admin' },
    process.env.PLATFORM_ADMIN_JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(admin) {
  return jwt.sign(
    { adminId: admin.id, scope: 'platform-admin' },
    process.env.PLATFORM_ADMIN_JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password.' });

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.headers['x-forwarded-for'] || null,
      },
    });

    return res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token required.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.PLATFORM_ADMIN_JWT_SECRET);
      if (decoded.scope !== 'platform-admin') throw new Error('wrong scope');
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const admin = await prisma.platformAdmin.findUnique({ where: { id: decoded.adminId } });
    if (!admin || !admin.refreshTokenHash) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const valid = await bcrypt.compare(token, admin.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Invalid refresh token.' });

    return res.json({ accessToken: generateAccessToken(admin) });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await prisma.platformAdmin.update({
      where: { id: req.platformAdmin.adminId },
      data: { refreshTokenHash: null },
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshToken, logout };
