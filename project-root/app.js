// app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Routers
import lessonsRouter from "./routes/lessons.js";
import memberLessonsRouter from "./routes/memberLessons.js";
import progressRoutes from "./routes/progress.js";
import userRoutes from "./routes/users.js";
import analyticsRoutes from "./routes/analytics.js";
import quizRoutes from "./routes/quizzes.js";
import settingsRoutes from "./routes/settings.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contact.js";
import mediaGradeRouter from "./routes/mediaGrade.js";

const app = express();

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`🛬 ${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonsRouter);
app.use("/api/memberLessons", memberLessonsRouter);
app.use("/api/progress", progressRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/lessons", mediaGradeRouter);

// Static build
app.use(express.static(path.join(__dirname, "foodhub-client", "build")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "foodhub-client", "build", "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

export default app;