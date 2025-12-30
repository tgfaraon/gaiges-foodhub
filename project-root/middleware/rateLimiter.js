import rateLimit from "express-rate-limit";

// Limit lesson submissions to 5 per minute per user
export const lessonSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Too many submissions, please wait a minute before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global limiter: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});