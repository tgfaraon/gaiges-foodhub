import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams();        // token comes from /reset/:token route
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");
    setLoading(true);

    if (password !== confirm) {
      setFeedback("❌ Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL
        ? `${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`
        : `http://localhost:5000/api/auth/reset-password/${token}`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setFeedback("✅ Password reset successful!");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setFeedback(data.message || "❌ Reset failed.");
      }
    } catch (err) {
      setFeedback("❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Set New Password</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          New Password
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Submitting..." : "Reset Password"}
        </button>
      </form>

      {feedback && (
        <p
          className={`auth-feedback ${
            feedback.startsWith("✅") ? "success" : "error"
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}