const express = require('express');
const { login, refreshToken, logout } = require('../controllers/platformAuthController');
const { verifyPlatformAdminToken } = require('../middleware/platformAuthMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyPlatformAdminToken, logout);

module.exports = router;
