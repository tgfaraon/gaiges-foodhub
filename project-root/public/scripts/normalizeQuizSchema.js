/**
 * Utility script to normalize quiz schema across all lessons.
 * Ensures every quiz question has acceptedKeywords (default empty array).
 */

const mongoose = require('mongoose');
const Lesson = require('../models/Lesson'); // adjust path if needed

// connect to your local MongoDB (update URI if using Atlas or different DB)
mongoose.connect('mongodb://127.0.0.1:27017/yourDatabaseName', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function normalizeQuizSchema() {
  try {
    const lessons = await Lesson.find({});
    console.log(`Found ${lessons.length} lessons`);

    for (const lesson of lessons) {
      let updated = false;

      if (Array.isArray(lesson.quiz)) {
        lesson.quiz = lesson.quiz.map(q => {
          if (!Array.isArray(q.acceptedKeywords)) {
            q.acceptedKeywords = [];
            updated = true;
          }
          if (typeof q.explanation !== 'string') {
            q.explanation = '';
            updated = true;
          }
          return q;
        });
      }

      if (updated) {
        await lesson.save();
        console.log(`Normalized lesson ${lesson._id} (${lesson.title})`);
      }
    }

    console.log('✅ Quiz schema normalization complete');
    process.exit(0);
  } catch (err) {
    console.error('Error normalizing quiz schema:', err);
    process.exit(1);
  }
}

normalizeQuizSchema();