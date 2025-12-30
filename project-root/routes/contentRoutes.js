const express = require('express');
const router = express.Router();
const { getContent } = require('../controllers/contentController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getContent);

module.exports = router;