const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Promote a user to admin — only gfhadmin can do this
router.post('/promote', authenticateToken, requireRole('admin'), async (req, res) => {
  const requesterUsername = req.user.username;
  const targetEmail = req.body.email;

  if (requesterUsername !== 'gfhadmin') {
    return res.status(403).json({ error: 'Only gfhadmin can assign admin roles' });
  }

  try {
    const user = await User.findOne({ email: targetEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = 'admin';
    await user.save();

    res.json({ message: `${targetEmail} has been promoted to admin.` });
  } catch (err) {
    console.error('Admin promotion failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all users (admin only in production)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'firstName email role');
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/saved', authenticateToken, async (req, res) => {
  try {
    // Example: saved items stored on user doc
    const user = await User.findById(req.userId);
    res.json({ items: user.savedItems || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved content' });
  }
});

module.exports = router;