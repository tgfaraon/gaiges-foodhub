import mongoose from "mongoose";

const { Schema, model } = mongoose;

const settingsSchema = new Schema(
  {
    announcementsEnabled: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    announcementText: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Only one settings document should exist
const Settings = model("Settings", settingsSchema, "settings");

export default Settings;