const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || '64e76c733d3ceee9ada2016ebd8953aa802f0cac52d6a25e9704fff6d88c88be';

router.post('/subscribe.html', async (req, res) => {
  const { firstName, lastName, username, password } = req.body;

  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: 'Username already taken.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ firstName, lastName, username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'User registered successfully.' });
});

router.post('/login.html', (req, res) => {
  const { username, password } = req.body;
  if (username === 'member@example.com' && password === 'secure') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

router.post('/forgot-password', async (req, res) => {
  // handle forgot password logic
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Missing token or password.' });
  }

  // TODO: Validate token, find user, update password
  console.log(`🔁 Resetting password with token: ${token}`);
  return res.status(200).json({ message: 'Password reset successful (mock).' });
});

router.post('/login.html', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/members.html', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  // TODO: Verify token and fetch user data
  res.sendFile(path.join(__dirname, '../public/members.html'));
});

module.exports = router;