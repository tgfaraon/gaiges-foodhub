import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import "../styles/forms.css";

export default function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Guard: if already submitting, ignore
  if (loading) return;

  setLoading(true);
  setFeedback("");

  if (formData.password !== formData.confirmPassword) {
    setFeedback("❌ Passwords do not match.");
    setLoading(false);
    return;
  }

  try {
    const apiUrl = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api/auth/register`
      : "http://localhost:5000/api/auth/register";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const token = data.token;
      const userInfo = data.user;

      if (token && userInfo) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userInfo));
        if (onRegister) onRegister({ token, user: userInfo });

        setFeedback("✅ Registration successful!");
        setTimeout(() => navigate("/lessons"), 900);
      } else {
        setFeedback("❌ Registration succeeded but no token received.");
      }
    } else {
      setFeedback(data.error || data.message || "Registration failed.");
    }
  } catch (err) {
    setFeedback("❌ Server error.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-card">
      <h1>Create Your Account</h1>

      <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
        <label>
          First Name
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Last Name
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Username
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        <label>
          Confirm Password
          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>

      {feedback && (
        <p
          className={`auth-feedback ${
            feedback.startsWith("✅") ? "success" : feedback.startsWith("❌") ? "error" : ""
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}