import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

import LessonList from "./components/LessonList";
import LessonViewer from "./components/LessonViewer";
import LessonEditor from "./components/LessonEditor";
import AdminDashboard from "./components/AdminDashboard";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Contact from "./components/Contact"; // ✅ new Contact page

import "./styles/App.css";
import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/animations.css";
import "./styles/modals.css";

function App() {
  const [account, setAccount] = useState({
    name: "",
    email: "",
    avatar: null,
    role: "",
  });

  // ✅ Hydrate account from storage immediately on mount
  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (storedUser) {
      setAccount({
        name: storedUser.firstName || storedUser.username,
        email: storedUser.email,
        avatar: storedUser.avatar || null,
        role: storedUser.role,
      });
    }

    // ✅ Then fetch fresh account data from backend
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const fetchAccount = async () => {
      try {
        const res = await fetch("${apiUrl}/api/users/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch account");
        const data = await res.json();
        setAccount({
          name: data.firstName || data.username,
          email: data.email,
          avatar: data.avatar || null,
          role: data.role,
        });

        // ✅ Sync to storage so Navbar sees it after reload
        localStorage.setItem("user", JSON.stringify(data));
        sessionStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error("Account fetch failed:", err);
      }
    };

    fetchAccount();
  }, []);

  // ✅ Update account state correctly from login response
  const handleLoginSuccess = (userData) => {
    console.log("✅ Login success in App.js:", userData);
    const user = userData.user;
    setAccount({
      name: user.firstName || user.username,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
    });

    // ✅ Sync to storage
    localStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("user", JSON.stringify(user));
  };

  // ✅ Admin route guard using storage fallback
  const AdminRoute = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!token || !storedUser || storedUser.role !== "admin") {
      console.warn("🚫 Unauthorized access to admin route");
      return <Navigate to="/login" replace />;
    }

    return <AdminDashboard token={token} />;
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar account={account} />

        <div className="app-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={<Login onLogin={handleLoginSuccess} />}
            />
            <Route
              path="/register"
              element={<Register onRegister={handleLoginSuccess} />}
            />

            {/* ✅ Forgot/Reset Password routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset/:token" element={<ResetPassword />} />

            {/* ✅ Lessons */}
            <Route
              path="/lessons"
              element={<LessonList account={account} setAccount={setAccount} />}
            />
            <Route path="/viewer" element={<LessonViewer />} />
            <Route path="/editor" element={<LessonEditor />} />

            {/* ✅ Admin */}
            <Route path="/admin" element={<AdminRoute />} />

            {/* ✅ Contact route */}
            <Route path="/contact" element={<Contact />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;