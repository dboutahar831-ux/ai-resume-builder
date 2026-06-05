const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);
router.get('/users/search', auth, authController.searchUsers);
router.put('/heartbeat', auth, authController.heartbeat);
router.delete('/account', auth, authController.deleteAccount);

module.exports = router;
