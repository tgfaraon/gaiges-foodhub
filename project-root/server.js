require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

const User = require('./models/Users');
const connectDB = require('./config/db');
const progressRoutes = require('./routes/progress');
const lessonRoutes = require('./routes/lessons');
const userRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/authMiddleware');

// ✅ Connect to MongoDB
connectDB();
User.init().then(() => {
  console.log('✅ User indexes ensured');
});

// ✅ Middleware FIRST (before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Logging middleware
app.use((req, res, next) => {
  console.log(`🛬 Incoming request: ${req.method} ${req.url}`);
  next();
});

// ✅ Routes
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ✅ Protected route for members.html
app.get('/members.html', (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  console.log('🔐 Received token:', token);

  if (!token) return res.status(401).send('Unauthorized');
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is missing from environment');
    return res.status(500).send('Server misconfiguration');
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.sendFile(path.join(__dirname, 'public/members.html'));
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    res.status(403).send('Invalid token');
  }
});

// Registration
app.post('/api/subscribe', async (req, res) => {
  console.log('📩 Raw registration body:', req.body); // debug log
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body || {};

    // Validate required fields
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!confirmPassword) missing.push('confirmPassword');

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    // Password checks
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumber || !hasSpecialChar) {
      return res.status(400).json({ message: 'Password must include a number and a special character.' });
    }

    // Normalize inputs
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ]
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists. Please choose another.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user' // default role
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: `🎉 Welcome, ${firstName}! Your account is ready.`,
      token
    });
  } catch (err) {
    console.error('💥 Error in /api/subscribe:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  console.log('📩 Raw login body:', req.body); // debug log
  const { username, password } = req.body || {};
  console.log('🔐 Login attempt:', username);

  const normalizedUsername = username?.trim().toLowerCase();

  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ message: 'Username and password required.' });
  }

  try {
    const user = await User.findOne({ username: normalizedUsername }).select('+password');
    console.log('🔍 Found user:', user);

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    console.log('✅ Authenticated:', user.username, '| Role:', user.role);

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: `Welcome back, ${user.firstName}!`, token });
  } catch (err) {
    console.error('💥 Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
}); 

// ✅ Debug token route
app.get('/api/debug-token', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ✅ Start server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});