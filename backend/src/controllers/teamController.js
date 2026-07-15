const crypto = require('crypto');
const prisma = require('../config/prismaClient');
const { sendInviteEmail } = require('../services/emailService');

const VALID_INVITE_ROLES = ['admin', 'manager', 'reporter', 'reader'];

// GET /api/team — list all members in the org
const getTeam = async (req, res, next) => {
  try {
    const { organizationId } = req.user;

    const members = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const pending = await prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
    });

    res.json({ members, pendingInvites: pending });
  } catch (error) {
    next(error);
  }
};

// POST /api/team/invite
const inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const { userId, organizationId } = req.user;

    if (!email || !role) return res.status(400).json({ error: 'Email and role are required.' });
    if (!VALID_INVITE_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${VALID_INVITE_ROLES.join(', ')}.` });
    }

    // Block if email already belongs to this org
    const existing = await prisma.user.findFirst({ where: { email, organizationId } });
    if (existing) return res.status(400).json({ error: 'This user is already a member of your organization.' });

    // Block if email already has an active invite
    const existingInvite = await prisma.invitation.findFirst({
      where: { email, organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) return res.status(400).json({ error: 'An active invite already exists for this email.' });

    const inviter = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.invitation.create({
      data: {
        organizationId,
        email,
        role,
        tokenHash,
        invitedById: userId,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;
    await sendInviteEmail(email, inviter.name, org.name, role, inviteLink);

    res.status(201).json({ message: `Invite sent to ${email}.` });
  } catch (error) {
    next(error);
  }
};

// PUT /api/team/:userId/role — change a member's role
const changeRole = async (req, res, next) => {
  try {
    const { userId: targetId } = req.params;
    const { role } = req.body;
    const { userId: requesterId, organizationId } = req.user;

    if (!role) return res.status(400).json({ error: 'Role is required.' });
    if (!VALID_INVITE_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${VALID_INVITE_ROLES.join(', ')}.` });
    }
    if (targetId === requesterId) return res.status(400).json({ error: 'You cannot change your own role.' });

    const target = await prisma.user.findFirst({ where: { id: targetId, organizationId } });
    if (!target) return res.status(404).json({ error: 'User not found in your organization.' });
    if (target.role === 'owner') return res.status(403).json({ error: 'The owner role cannot be changed.' });

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/team/:userId — remove a member
const removeMember = async (req, res, next) => {
  try {
    const { userId: targetId } = req.params;
    const { userId: requesterId, organizationId } = req.user;

    if (targetId === requesterId) return res.status(400).json({ error: 'You cannot remove yourself.' });

    const target = await prisma.user.findFirst({ where: { id: targetId, organizationId } });
    if (!target) return res.status(404).json({ error: 'User not found in your organization.' });
    if (target.role === 'owner') return res.status(403).json({ error: 'The owner cannot be removed.' });

    await prisma.user.update({
      where: { id: targetId },
      data: { organizationId: null },
    });

    res.json({ message: `${target.name} has been removed from the organization.` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/team/invites/:inviteId — cancel a pending invite
const cancelInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const { organizationId } = req.user;

    const invite = await prisma.invitation.findFirst({ where: { id: inviteId, organizationId } });
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });

    await prisma.invitation.delete({ where: { id: inviteId } });
    res.json({ message: 'Invite cancelled.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeam, inviteUser, changeRole, removeMember, cancelInvite };
