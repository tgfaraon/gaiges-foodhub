import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questions: [
      {
        question: { type: String, required: true },

        // For free‑text quizzes, options can be optional or omitted
        options: [{ type: String }], 

        // Canonical expected answer (used by AI grader for normalization)
        correctAnswer: { type: String, required: true },

        // Flexible keyword matches (AI grader checks these too)
        acceptedKeywords: {
          type: [String],
          default: [],
        },

        // Explanation shown when correct
        explanation: {
          type: String,
          default: "",
        },

        // Hint shown when wrong
        hint: {
          type: String,
          default: "",
        },
      },
    ],

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    tags: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;