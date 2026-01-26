import React from "react";
import { Link } from "react-router-dom";
import "../styles/global.css";
import "../styles/dashboard.css";
import "../styles/animations.css";
import "../styles/modals.css";

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header
        className="header"
        style={{
          backgroundColor: "rgb(212, 191,157)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "4rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ color: "rgb(194, 146, 107)" }}>Welcome to Gaige's Food Hub</h1>
          <p style={{ color: "white", marginTop: "0.5rem" }}>
            Your one-stop destination for delicious food from your own hands!
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <Link className="logo" to="/">Gaige's Food Hub</Link>
        <div className="explore" id="explore">
          <button className="explore-toggle" aria-haspopup="true" aria-expanded="false">
            Explore ▾
          </button>
          <ul id="nav-links" className="nav-links" role="menubar">
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/register">Get Started</Link></li>
            <li><a href="#about">About</a></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="nav-actions" id="nav-actions">
          <Link
            id="navbar-subscribe"
            className="cta-button cta-cook"
            to="/register"
            aria-label="Start cooking now"
          >
            🍳 Cook Now!
          </Link>
          <Link
            to="/login"
            className="cta-button cta-login"
            aria-label="Log in to your account"
          >
            🔑 Log in
          </Link>
        </div>
      </nav>

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-container">
          <div className="about-image">
            <img src="/assets/saltimbocca.jpg" alt="Delicious Food" />
            <img src="/assets/Burrata.jpg" alt="Burrata" />
          </div>
          <div className="about-text" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2>About Us</h2>
            <ul className="lists">
              <li>
                <h3 className="list-title" style={{ color: "#63372c" }}>What we do:</h3>
                <p>
                  At Gaige's Food Hub, we provide professional cooking instructions so you can learn to prepare delicious meals like a pro from the comfort of your own home.
                </p>
              </li>
              <li>
                <h3 className="list-title" style={{ color: "#63372c" }}>Our Mission:</h3>
                <p>
                  Our mission is to empower home cooks of all skill levels to create restaurant-quality dishes with ease and confidence.
                </p>
              </li>
              <li>
                <h3 className="list-title" style={{ color: "#63372c" }}>What you will learn:</h3>
                <p>
                  By joining Gaige's Food Hub, you will learn essential cooking techniques, how to select and use quality ingredients, and how to master a variety of recipes from simple weeknight dinners to impressive gourmet dishes.
                </p>
                <p style={{ marginTop: "2rem" }}>
                  We understand that cooking can be intimidating, especially for those who are new to the kitchen. That's why we offer a wide range of resources and support to help our members succeed.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;