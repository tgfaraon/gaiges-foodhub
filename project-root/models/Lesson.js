import mongoose from "mongoose";

// Sub-schema for quiz questions
const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], default: [] }, 
    correctAnswer: { type: String, default: "" },
    acceptedKeywords: { type: [String], default: [] },
    explanation: { type: String, default: "" },
    tag: { type: String, default: "" },
  },
  { _id: false }
);

// Sub-schema for lesson sections
const sectionSchema = new mongoose.Schema(
  {
    sectionTitle: { type: String, default: "" },
    sectionContent: { type: String, default: "" },
  },
  { _id: false }
);

// Main lesson schema
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    introduction: { type: String, default: "" },

    whatYouWillLearn: { type: [String], default: [] },
    ingredients: { type: [String], default: [] },
    tools: { type: [String], default: [] },

    content: { type: String, default: "" },
    sections: { type: [sectionSchema], default: [] },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "advanced"],
      default: "easy",
    },

    tags: { type: [String], default: [] },
    time: { type: String, default: "" },

    youtubeId: {
      type: String,
      default: "",
      match: /^[a-zA-Z0-9_-]{11}$/,
    },

    quiz: { type: [quizQuestionSchema], default: [] },

    order: { type: Number, required: true, unique: true },
    curriculumGroup: { type: String, default: "" },
    attachments: { type: [String], default: [] },

    // ✅ NEW FIELD
    supportsMediaGrading: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema, "lessons");

export default Lesson;