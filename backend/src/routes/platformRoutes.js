const express = require('express');
const { verifyPlatformAdminToken } = require('../middleware/platformAuthMiddleware');
const {
  getOrganizations,
  getOrganization,
  suspendOrganization,
  unsuspendOrganization,
  updatePlanTier,
  updateLicense,
  deleteMember,
  deleteOrganization,
  resetMemberPassword,
} = require('../controllers/platformController');

const router = express.Router();

router.use(verifyPlatformAdminToken);

router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganization);
router.put('/organizations/:id/suspend', suspendOrganization);
router.put('/organizations/:id/unsuspend', unsuspendOrganization);
router.put('/organizations/:id/plan', updatePlanTier);
router.put('/organizations/:id/license', updateLicense);
router.delete('/organizations/:id', deleteOrganization);
router.delete('/organizations/:orgId/members/:userId', deleteMember);
router.put('/organizations/:orgId/members/:userId/reset-password', resetMemberPassword);

module.exports = router;
