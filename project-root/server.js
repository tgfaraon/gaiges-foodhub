import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import User from "./models/Users.js";

// ---- Startup checks ----
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing from environment. Set it in .env.");
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing from environment. Set it in .env.");
  process.exit(1);
}

// ---- MongoDB connection ----
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅ Connected to MongoDB at ${MONGO_URI}`);
    console.log(`📂 Active DB: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

User.init()
  .then(() => console.log("✅ User indexes ensured"))
  .catch((err) => console.error("❌ Failed to ensure user indexes:", err));

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});