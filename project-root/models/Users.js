import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ✅ Basic identity fields
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    // ✅ Authentication + contact
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    // ✅ Profile
    avatar: { type: String, default: null }, // base64 or URL
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    active: {
      type: Boolean,
      default: true, // admin can deactivate accounts
    },

    // ✅ Saved items (recipes, lessons, etc.)
    savedItems: {
      type: [String],
      default: [],
    },

    // ✅ User preferences
    preferences: {
      goal: { type: String, default: "meal-prep" },
      diets: { type: [String], default: [] },
    },

    // ✅ Lesson tracking
    savedLessons: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }
    ],
    completedLessons: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Lesson",
      default: [],
    },

    // ✅ Password reset
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

const User = mongoose.model("User", userSchema);

export default User;