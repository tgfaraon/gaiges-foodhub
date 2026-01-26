import React, { useState } from "react";
import "../styles/forms.css";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send feedback");

      await res.json();
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("❌ Error sending feedback:", err);
      setStatus("error");
    }
  };

  return (
    <div className="form-container">
      <h1 className="lesson-title">Contact Us</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Message
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" className="submit-button">
          Send Feedback
        </button>
      </form>

      {status === "loading" && <p>Sending your feedback…</p>}
      {status === "success" && <p>✅ Thanks for your feedback!</p>}
      {status === "error" && <p>❌ Something went wrong. Please try again.</p>}
    </div>
  );
}