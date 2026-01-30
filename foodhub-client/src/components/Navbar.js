import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import React from "react";

export default function Navbar({ account }) {
  const [exploreOpen, setExploreOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const exploreRef = useRef(null);
  const memberRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const avatar = account?.avatar;
  const name = account?.name || "Member";
  const role = account?.role;

  useEffect(() => {
    function handleClickOutside(event) {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setExploreOpen(false);
      }
      if (memberRef.current && !memberRef.current.contains(event.target)) {
        setMemberOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    console.log("🚪 Logged out: tokens cleared");
    navigate("/login");
  };

  // Works in member dashboard as before; if not on it, route with a hash
  const scrollToSection = (id) => {
    const onMemberDashboard = location.pathname === "/lessons"; // ✅ match App.js route

    if (onMemberDashboard) {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
      setMemberOpen(false);
    } else {
      // Navigate back to lessons route with hash
      navigate(`/lessons#${id}`);
      setMemberOpen(false);
    }
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <Link className="logo" to="/">Gaige's Food Hub</Link>

      <div className="nav-actions">
        {/* Explore dropdown */}
        <div className="explore" ref={exploreRef}>
          <button
            type="button"
            className="explore-toggle"
            aria-haspopup="true"
            aria-expanded={exploreOpen}
            onClick={() => setExploreOpen(!exploreOpen)}
          >
            Explore ▾
          </button>
          <ul
            id="nav-links"
            className={`nav-links ${exploreOpen ? "" : "hidden"}`}
            role="menubar"
          >
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </div>

        {/* Member dropdown */}
        <div className="member-dropdown" ref={memberRef}>
          <button
            type="button"
            className="dropdown-toggle avatar-button"
            aria-haspopup="true"
            aria-expanded={memberOpen}
            onClick={() => setMemberOpen(!memberOpen)}
          >
            {avatar ? (
              <img src={avatar} alt="User avatar" className="navbar-avatar" />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="Default user"
                className="navbar-avatar"
              />
            )}
            <span id="avatar-caret">▾</span>
          </button>
          <div
            id="member-menu"
            className={`dropdown-content ${memberOpen ? "" : "hidden"}`}
          >
            <div
              id="member-greeting"
              style={{ padding: "10px 16px", fontWeight: "bold", color: "#573026" }}
            >
              Hi, {name}!
            </div>

            {role === "admin" && (
              <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
            )}

            <button type="button" className="dropdown-item" onClick={() => scrollToSection("lessons")}>
              Lessons
            </button>
            <button type="button" className="dropdown-item" onClick={() => scrollToSection("member-saved")}>
              Saved Recipes & Lessons
            </button>
            <button type="button" className="dropdown-item" onClick={() => scrollToSection("preferences")}>
              Preferences
            </button>
            <button type="button" className="dropdown-item" onClick={() => scrollToSection("account-settings")}>
              Account Settings
            </button>
            <button type="button" id="logout-link" className="dropdown-item" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}