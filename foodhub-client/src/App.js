import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react"; import Login from "./components/Login";

import Register from "./components/Register"; import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword"; import LessonList from "./components/LessonList";
import LessonViewer from "./components/LessonViewer";
import LessonEditor from "./components/LessonEditor";
import AdminDashboard from "./components/AdminDashboard";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Contact from "./components/Contact";

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

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (storedUser) {
      setAccount({
        name: storedUser.firstName || storedUser.username,
        email: storedUser.email,
        avatar: storedUser.avatar || null, role: storedUser.role,
      });
    }

    const apiUrl = process.env.REACT_APP_API_URL;
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const fetchAccount = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/users/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch account");
        const data = await res.json();
        setAccount({
          name: data.firstName || data.username,
          email: data.email, avatar: data.avatar || null,
          role: data.role,
        });

        localStorage.setItem("user", JSON.stringify(data));
        sessionStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error("Account fetch failed:", err);
      }

    }; fetchAccount();
  }, []);

  const handleLoginSuccess = (userData) => {
    const user = userData.user;
    setAccount({
      name: user.firstName || user.username,
      email: user.email, avatar: user.avatar || null,
      role: user.role,
    });

    localStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("user", JSON.stringify(user));
  };

  const AdminRoute = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!token || !storedUser || storedUser.role !== "admin") {
      return <Navigate to="/login" replace />;
    }

    return <AdminDashboard token={token} />;
  };

  return (
    <AppContent
      account={account}
      handleLoginSuccess={handleLoginSuccess}
      AdminRoute={AdminRoute}
    />
  );
}

function AppContent({ account, handleLoginSuccess, AdminRoute }) {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="app-layout">
      {!isLandingPage && <Navbar account={account} />}

      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
          <Route path="/register" element={<Register onRegister={handleLoginSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/lessons" element={<LessonList account={account} setAccount={() => { }} />} />
          <Route path="/viewer" element={<LessonViewer />} />
          <Route path="/editor" element={<LessonEditor />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} /> </Routes>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;