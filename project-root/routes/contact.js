import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// ✅ Route now matches /api/contact (clean, isolated)
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await sendEmail(
      "gfhadmin@gaigesfoodhub.com",
      `New Feedback from ${name}`,
      {
        html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
        text: `From: ${name} (${email})\n\n${message}`,
      }
    );

    res.json({ message: "Feedback sent successfully" });
  } catch (err) {
    console.error("❌ Error sending feedback:", err);
    res.status(500).json({ error: "Failed to send feedback" });
  }
});

export default router;