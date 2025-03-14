// ecommerce-backend/routes/users.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Multer setup for avatar upload
const storage = multer.diskStorage({
  destination: './uploads/avatars/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, address },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload avatar
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = `http://localhost:5001/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Avatar uploaded', user });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
});

// Get all addresses
router.get('/profile/addresses', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error('Get Addresses Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new address
router.post('/profile/addresses', authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: 'Address is required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.addresses = user.addresses || [];
    user.addresses.push({ address, _id: new mongoose.Types.ObjectId() });
    await user.save();
    res.json({ message: 'Address added', addresses: user.addresses });
  } catch (error) {
    console.error('Add Address Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete address
router.delete('/profile/addresses/:addressId', authMiddleware, async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== addressId);
    await user.save();
    res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payment methods
router.get('/profile/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ paymentMethods: user.paymentMethods || [] });
  } catch (error) {
    console.error('Get Payment Methods Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new payment method
router.post('/profile/payment-methods', authMiddleware, async (req, res) => {
  try {
    const { cardNumber, expiry, name } = req.body;
    if (!cardNumber || !expiry || !name) {
      return res.status(400).json({ message: 'All payment fields are required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.paymentMethods = user.paymentMethods || [];
    user.paymentMethods.push({ cardNumber, expiry, name, _id: new mongoose.Types.ObjectId() });
    await user.save();
    res.json({ message: 'Payment method added', paymentMethods: user.paymentMethods });
  } catch (error) {
    console.error('Add Payment Method Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payment method
router.delete('/profile/payment-methods/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.paymentMethods = user.paymentMethods.filter((method) => method._id.toString() !== paymentId);
    await user.save();
    res.json({ message: 'Payment method deleted', paymentMethods: user.paymentMethods });
  } catch (error) {
    console.error('Delete Payment Method Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update password
router.put('/profile/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;