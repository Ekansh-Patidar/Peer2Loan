const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} = require('../validators/auth.validator');

const router = express.Router();

// Public routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', authController.getMe);
router.put('/profile', updateProfileValidator, validate, authController.updateProfile);
router.put('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;