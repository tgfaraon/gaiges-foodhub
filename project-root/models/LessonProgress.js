const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  progress: { type: Number, default: 0 } // percentage complete
});

module.exports = mongoose.model('LessonProgress', LessonProgressSchema);