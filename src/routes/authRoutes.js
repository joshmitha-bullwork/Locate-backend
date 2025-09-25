// routes/authRoutes.js
const express = require('express');
const { register, login, verifyOtp, checkAuthStatus, logout, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware'); // Make sure this path is correct

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/check-auth', checkAuthStatus);
router.post('/logout', logout);

// 👇️ THIS IS THE CRUCIAL CHANGE
router.get('/profile', protect, getProfile);

// Example of a protected route where the middleware is necessary
// router.get('/dashboard', protect, (req, res) => {
//   res.status(200).json({ message: `Welcome, user ${req.user.id}` });
// });

module.exports = router;