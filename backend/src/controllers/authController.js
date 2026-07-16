const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prismaClient');
const {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
} = require('../services/emailService');

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Register ────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { email, password, name, organizationName } = req.body;

    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({ error: 'Name, email, password, and organization name are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
      // PENDING: resend OTP
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      await prisma.otpVerification.create({
        data: {
          userId: existing.id,
          otpHash,
          purpose: 'EMAIL_VERIFY',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      await sendOtpEmail(email, existing.name, otp);
      return res.status(200).json({ message: 'OTP resent. Please check your email.', email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create org + owner user in a transaction
    const org = await prisma.organization.create({
      data: { name: organizationName },
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'owner',
        status: 'PENDING',
        emailVerified: false,
        organizationId: org.id,
      },
    });

    await prisma.license.create({
      data: {
        type: 'free',
        itemLimit: 1000,
        maxUsers: 10,
        users: { connect: { id: user.id } },
      },
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpHash,
        purpose: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(email, name, otp);

    return res.status(201).json({
      message: 'Account created. Please check your email for a 6-digit verification code.',
      email,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid request.' });
    if (user.status === 'ACTIVE') return res.status(400).json({ error: 'Email is already verified.' });

    const record = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });

    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) return res.status(400).json({ error: 'Invalid OTP.' });

    await prisma.$transaction([
      prisma.otpVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, status: 'ACTIVE' } }),
    ]);

    return res.json({ message: 'Email verified. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status === 'ACTIVE') return res.status(400).json({ error: 'Invalid request.' });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpHash,
        purpose: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await sendOtpEmail(email, user.name, otp);
    return res.json({ message: 'OTP resent. Please check your email.' });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { license: true, organization: true },
    });

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Email not verified. Please check your email for the verification code.',
        requiresVerification: true,
        email: user.email,
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    if (user.mustChangePassword) {
      return res.status(403).json({
        error: 'Your password was reset by an administrator. Please set a new password to continue.',
        requiresPasswordChange: true,
        email: user.email,
      });
    }

    if (user.organization?.status === 'suspended') {
      return res.status(403).json({
        error: user.organization.suspendedReason
          ? `Your organization has been suspended: ${user.organization.suspendedReason}`
          : 'Your organization has been suspended. Please contact support.',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
        license: user.license || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token required.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Invalid refresh token.' });

    if (user.organization?.status === 'suspended') {
      return res.status(403).json({
        error: user.organization.suspendedReason
          ? `Your organization has been suspended: ${user.organization.suspendedReason}`
          : 'Your organization has been suspended. Please contact support.',
      });
    }

    return res.json({ accessToken: generateAccessToken(user) });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshTokenHash: null },
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const genericResponse = { message: "If that email is registered, you'll receive a reset link shortly." };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') return res.json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, user.name, resetLink);
    return res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetToken || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (tokenHash !== user.passwordResetToken) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshTokenHash: null,
        mustChangePassword: false,
      },
    });

    return res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// ─── Force Change Password (after an admin reset) ────────────────────────────

const forceChangePassword = async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required.' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.mustChangePassword) {
      return res.status(400).json({ error: 'No password change is required for this account.' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Current password is incorrect.' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
        refreshTokenHash: null,
      },
    });

    return res.json({ message: 'Password changed successfully. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// ─── Accept Invite ────────────────────────────────────────────────────────────

const acceptInvite = async (req, res, next) => {
  try {
    const { email, token, name, password } = req.body;

    if (!email || !token || !name || !password) {
      return res.status(400).json({ error: 'Email, token, name, and password are required.' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.invitation.findFirst({
      where: {
        email,
        tokenHash,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) return res.status(400).json({ error: 'Invite link is invalid or has expired.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name,
        role: invitation.role,
        status: 'ACTIVE',
        emailVerified: true,
        organizationId: invitation.organizationId,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  forceChangePassword,
  acceptInvite,
};
