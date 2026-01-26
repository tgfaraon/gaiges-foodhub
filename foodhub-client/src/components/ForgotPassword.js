import React, { useState } from "react";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");

    try {
      const apiUrl = process.env.REACT_APP_API_URL
        ? `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`
        : "http://localhost:5000/api/auth/forgot-password";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setFeedback("✅ Password reset email sent. Check your inbox.");
      } else {
        setFeedback(data.message || "❌ Could not send reset email.");
      }
    } catch (err) {
      setFeedback("❌ Server error.");
    }
  };

  return (
    <div className="auth-card">
      <h1>Reset Your Password</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="submit-button">Send Reset Link</button>
      </form>
      {feedback && (
        <p className={`auth-feedback ${feedback.startsWith("✅") ? "success" : "error"}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}