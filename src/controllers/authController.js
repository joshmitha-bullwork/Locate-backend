const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  const { name, email, phoneNumber } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }
    await prisma.user.create({
      data: { 
        name, 
        email, 
        phoneNumber, 
        isVerified: false,
      },
    });
    res.status(201).json({ message: 'User registered successfully. You can now log in.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Login OTP',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });
    
    const tempToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.cookie('temp-token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 10 * 60 * 1000,
    });

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const tempToken = req.cookies['temp-token'];

  if (!tempToken) {
    return res.status(401).json({ message: 'Unauthorized: No session token provided.' });
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    
    res.clearCookie('temp-token');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
     res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Keep this as false for local development
      sameSite: 'Lax', // Change this back from 'None' to 'Lax'
      maxAge: 120 * 60 * 1000,
    });
    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otp: null, otpExpiresAt: null },
    });

    res.status(200).json({ message: 'Verification successful.' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.checkAuthStatus = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'User is authenticated.' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
  }
};
// A new function in your authController.js or authRoutes.js
exports.getProfile = async (req, res) => {
  try {
    // The user ID is added to the request by your authentication middleware
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully.' });
};