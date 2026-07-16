const prisma = require('../config/prismaClient');

const VALID_TIERS = ['free', 'starter', 'pro', 'enterprise'];
const PAGE_SIZE = 20;

const MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  licenseId: true,
  license: { select: { type: true, itemLimit: true, maxUsers: true, expiryDate: true } },
};

function summarizeOrg(org) {
  const owner = org.users.find(u => u.role === 'owner') || null;
  const lastActivity = org.users.reduce((max, u) => {
    if (!u.lastLoginAt) return max;
    return !max || u.lastLoginAt > max ? u.lastLoginAt : max;
  }, null);

  return {
    id: org.id,
    name: org.name,
    status: org.status,
    suspendedReason: org.suspendedReason,
    suspendedAt: org.suspendedAt,
    planTier: org.planTier,
    createdAt: org.createdAt,
    memberCount: org.users.length,
    lastActivity,
    owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    license: owner?.license || null,
  };
}

// GET /api/platform/organizations?search=&tier=&page=
const getOrganizations = async (req, res, next) => {
  try {
    const { search, tier, page } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);

    const where = {};
    if (tier) where.planTier = tier;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { users: { some: { email: { contains: search } } } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: { users: { select: MEMBER_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({
      organizations: organizations.map(summarizeOrg),
      total,
      page: pageNum,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/platform/organizations/:id
const getOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { users: { select: MEMBER_SELECT, orderBy: { createdAt: 'asc' } } },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const owner = org.users.find(u => u.role === 'owner') || null;

    res.json({
      id: org.id,
      name: org.name,
      status: org.status,
      planTier: org.planTier,
      suspendedReason: org.suspendedReason,
      suspendedAt: org.suspendedAt,
      createdAt: org.createdAt,
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
      license: owner?.license || null,
      members: org.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/platform/organizations/:id/suspend
const suspendOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const updated = await prisma.organization.update({
      where: { id },
      data: { status: 'suspended', suspendedReason: reason || null, suspendedAt: new Date() },
    });
    res.json({ message: `${updated.name} has been suspended.`, organization: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/platform/organizations/:id/unsuspend
const unsuspendOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const updated = await prisma.organization.update({
      where: { id },
      data: { status: 'active', suspendedReason: null, suspendedAt: null },
    });
    res.json({ message: `${updated.name} has been unsuspended.`, organization: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/platform/organizations/:id/plan
const updatePlanTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { planTier } = req.body;

    if (!planTier || !VALID_TIERS.includes(planTier)) {
      return res.status(400).json({ error: `planTier must be one of: ${VALID_TIERS.join(', ')}` });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const updated = await prisma.organization.update({ where: { id }, data: { planTier } });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// PUT /api/platform/organizations/:id/license
const updateLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, itemLimit, maxUsers, expiryDate } = req.body;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { users: { where: { role: 'owner' }, select: { id: true, licenseId: true } } },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const owner = org.users[0];
    if (!owner) return res.status(404).json({ error: 'Organization has no owner to attach a license to.' });

    const data = {};
    if (type !== undefined) data.type = type;
    if (itemLimit !== undefined) data.itemLimit = parseInt(itemLimit);
    if (maxUsers !== undefined) data.maxUsers = parseInt(maxUsers);
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;

    let license;
    if (owner.licenseId) {
      license = await prisma.license.update({ where: { id: owner.licenseId }, data });
    } else {
      license = await prisma.license.create({
        data: {
          type: type || 'free',
          itemLimit: itemLimit !== undefined ? parseInt(itemLimit) : 1000,
          maxUsers: maxUsers !== undefined ? parseInt(maxUsers) : 10,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          users: { connect: { id: owner.id } },
        },
      });
    }
    res.json(license);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizations,
  getOrganization,
  suspendOrganization,
  unsuspendOrganization,
  updatePlanTier,
  updateLicense,
};
