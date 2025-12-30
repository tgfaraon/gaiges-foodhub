// controllers/subscribeController.js
import { generateWelcomeEmail } from "../utils/sendEmail.js";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

export async function handleSubscribe(req, res) {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    console.log(`📝 New subscriber: ${name} <${email}>`);

    // This pulls in the full HTML + text template
    await sendWelcomeEmail({ name, email }, "http://localhost:5000/login");

    res.json({ message: "Subscribed successfully. Welcome email sent." });
  } catch (err) {
    console.error("❌ Subscription error:", err);
    res.status(500).json({ error: "Failed to process subscription" });
  }
}