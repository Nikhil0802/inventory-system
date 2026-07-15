const express = require('express');
const { getTeam, inviteUser, changeRole, removeMember, cancelInvite } = require('../controllers/teamController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', getTeam);
router.post('/invite', checkPermission('manage:users'), inviteUser);
router.put('/:userId/role', checkPermission('manage:users'), changeRole);
router.delete('/invites/:inviteId', checkPermission('manage:users'), cancelInvite);
router.delete('/:userId', checkPermission('manage:users'), removeMember);

module.exports = router;
