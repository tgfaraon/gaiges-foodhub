const mongoose = require('mongoose');

// Sub-schema for quiz questions
const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // multiple choice options
  correctAnswer: { type: Number, required: true }, // index of correct option in options[]
  explanation: { type: String } // optional rationale
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'], // ✅ capitalized values
    required: true
  },
  tags: [String],
  estimatedTime: String,
  videoUrl: String,
  quiz: { type: Array, default: [] }
}, { timestamps: true })
 

module.exports = mongoose.model('Lesson', lessonSchema);