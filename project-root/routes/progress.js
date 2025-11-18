const express = require('express');
const router = express.Router();
const LessonProgress = require('../models/LessonProgress');
const { authenticateToken } = require('../middleware/authMiddleware');

// Per-lesson progress
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.userId;

  try {
    const progressDoc = await LessonProgress.findOne({ userId, lessonId });
    const currentProgress = progressDoc?.progress || 0;
    res.json({ progress: currentProgress });
  } catch (err) {
    console.error('Error fetching lesson progress:', err);
    res.status(500).json({ error: 'Failed to fetch lesson progress' });
  }
});

// Overall progress
router.get('/overall', authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    const allProgress = await LessonProgress.find({ userId });
    const totalLessons = allProgress.length || 1;
    const sumProgress = allProgress.reduce((sum, lp) => sum + (lp.progress || 0), 0);
    const overall = Math.round(sumProgress / totalLessons);

    res.json({ progress: overall });
  } catch (err) {
    console.error('Error fetching overall progress:', err);
    res.status(500).json({ error: 'Failed to fetch overall progress' });
  }
});

module.exports = router;