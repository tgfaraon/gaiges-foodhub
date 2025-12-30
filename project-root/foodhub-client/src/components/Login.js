import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import "../styles/forms.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Rehydrate session on load (supports Remember Me)
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (storedToken && storedUser && onLogin) {
      onLogin({ token: storedToken, user: JSON.parse(storedUser) });
      navigate("/lessons");
    }
  }, [onLogin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const apiUrl = process.env.REACT_APP_API_URL
        ? `${process.env.REACT_APP_API_URL}/api/auth/login`
        : "http://localhost:5000/api/auth/login";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Invalid username or password");
        return;
      }

      const token = data.token;
      if (!token) {
        alert("Login failed: no token received");
        return;
      }

      const userInfo = data.user || {
        username: data.username,
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      // Persist based on Remember Me
      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userInfo));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(userInfo));
      }

      if (onLogin) onLogin({ token, user: userInfo });
      navigate("/lessons");
    } catch (err) {
      alert("Server error during login");
    }
  };

  return (
    <div className="auth-card">
      <h1>Member Login</h1>

      <form onSubmit={handleSubmit} className="auth-form">
  <label>
    Username
    <input
      type="text"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      required
    />
  </label>

  <label>
    Password
    <div className="password-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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

  {/* Remember Me aligned left with text */}
  <div className="remember-me">
    <input
    type="checkbox"
    id="rememberMe"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
    <label htmlFor="rememberMe">Remember Me</label>
  </div>

  <button type="submit" className="submit-button">Login</button>
</form>

{/* Forgot Password link */}
<p className="forgot-link">
  <a href="/forgot-password">Forgot your password?</a>
</p>
    </div>
  );
}