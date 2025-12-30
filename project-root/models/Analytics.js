import mongoose from "mongoose";

const { Schema, model } = mongoose;

const analyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    completionPercentage: { type: Number, default: 0 }, // 0–100
  },
  { timestamps: true }
);

// ✅ Explicit collection name "analytics"
const Analytics = model("Analytics", analyticsSchema, "analytics");

export default Analytics;