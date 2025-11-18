const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const Lesson = require('../models/Lesson');

// POST /api/lessons → Create new lesson
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  console.log('📩 Lesson POST raw body:', req.body);

  try {
    const { title, content, difficulty, tags, estimatedTime, videoUrl } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields: title and content' });
    }

    // Accept tags as string or array
    const tagsArray = Array.isArray(tags)
  ? tags.map(t => String(t).trim()).filter(Boolean)
  : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const newLesson = new Lesson({
      title,
      content,
      difficulty,
      tags: tagsArray,
      estimatedTime,
      videoUrl,
      quiz: Array.isArray(quiz) ? quiz : []
    });

    await newLesson.save();
    res.status(201).json(newLesson);
  } catch (err) {
    console.error('Error creating lesson:', err);
    res.status(400).json({ error: 'Invalid lesson data' });
  }
});

// GET /api/lessons → Fetch all lessons
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: -1 });
    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /api/lessons/:id → Fetch a single lesson by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (err) {
    console.error('Error fetching lesson:', err);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// DELETE /api/lessons/:id → Remove a lesson
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Lesson.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ message: `Lesson "${deleted.title}" deleted successfully.` });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// UPDATE a lesson
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Lesson not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

module.exports = router;