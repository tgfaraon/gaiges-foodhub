function login(req, res) {
  const { username, password } = req.body;

  // Basic check — replace with real logic later
  if (username === 'member' && password === 'secure') {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

module.exports = { login };