const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Missing name or email' });
  }

  return res.status(200).json({ message: 'Thanks — you are subscribed.' });
});

module.exports = router;