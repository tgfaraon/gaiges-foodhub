import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import DashboardCard from "./DashboardCard";
import BadgeStreakDisplay from "./BadgeStreakDisplay";
import Alert from "./Alert";
import "../styles/dashboard.css";
import CertificateLink from "../components/CertificateLink";
import { jwtDecode } from "jwt-decode";

export default function LessonList({ user, account, setAccount }) {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const [preferences, setPreferences] = useState({
    goal: "meal-prep",
    diets: [],
  });

  const apiUrl = process.env.REACT_APP_API_URL;

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

  // 🔧 New state for saved lessons
  const [savedItems, setSavedItems] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState("");

  // Token from localStorage or sessionStorage
  const effectiveToken =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // ⭐ NEW: Determine next lesson
  const nextLessonOrder = progress?.completedLessons?.length
    ? progress.completedLessons.length + 1
    : 1;

  const nextLesson = lessons.find((l) => l.order === nextLessonOrder);
  const decoded = jwtDecode(effectiveToken);
  const userId = decoded.userId || decoded.user_id || decoded.id;

  const savePreferences = async () => {
    setSavingPrefs(true);
    setPrefsMessage("");
    try {
      const res = await fetch("${apiUrl}/api/users/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save preferences: ${text}`);
      }

      const updated = await res.json();
      setPreferences(updated);
      setPrefsMessage("Preferences saved successfully.");
    } catch (err) {
      console.error("Error saving preferences:", err);
      setPrefsMessage("Failed to save preferences. Please try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveAccountSettings = async () => {
    setSavingAccount(true);
    setAccountMessage("");
    try {
      const res = await fetch("${apiUrl}/api/users/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(account),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save account settings: ${text}`);
      }

      const data = await res.json();

      if (data && data.user) {
        setAccount({
          name: data.user.firstName || data.user.username,
          email: data.user.email,
          avatar: data.user.avatar || null,
          role: data.user.role,
        });

        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      setAccountMessage("Account settings updated.");
    } catch (err) {
      console.error("Error saving account settings:", err);
      setAccountMessage("Failed to save account settings. Please try again.");
    } finally {
      setSavingAccount(false);
    }
  };

  // 1. Your existing data loader
  useEffect(() => {
    const loadMemberData = async () => {
      if (!effectiveToken) {
        setError("No token found in storage");
        return;
      }

      const fetchWithAuth = async (url) => {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ${url}: ${text}`);
        }
        return res.json();
      };

      try {
        const progressData = await fetchWithAuth("${apiUrl}/api/progress");
        setProgress(progressData);

        const lessonsData = await fetchWithAuth("${apiUrl}/api/lessons");
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);

        setLoadingSaved(true);
        const savedData = await fetchWithAuth("${apiUrl}/api/users/saved");
        setSavedItems(savedData.items || []);

        const accountData = await fetchWithAuth("${apiUrl}/api/users/account");
        setAccount(accountData);

        const prefsData = await fetchWithAuth("${apiUrl}/api/users/preferences");
        setPreferences(prefsData);

      } catch (err) {
        console.error("Error loading member data:", err);
        setError("Could not load member data. Please try again.");
        setSavedError("Could not load saved lessons.");
      } finally {
        setLoadingSaved(false);
      }
    };

    loadMemberData();
  }, [effectiveToken]);

  // 2. Separate effect for hash scrolling
  const location = useLocation();

  const TOTAL_LESSONS = 30;

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div className="auth-card">
      <h1>Member Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {progress && (

        <DashboardCard title="Your Progress" collapsible>
          <p>
            Progress: {progress.completedLessons?.length || 0} / {TOTAL_LESSONS}
          </p>

          <div className="progress-bar">
            <div className="fill" style={{ width: `${Math.min(progress.completionPercentage || 0, 100)}%`, }} >
              <span className="label">
                {Math.min(progress.completionPercentage || 0, 100)}%
              </span>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* 🎓 Certificate Viewer */}
      <DashboardCard title="Your Certificate" collapsible>
        <CertificateLink userId={userId} />
      </DashboardCard>

      {progress && <BadgeStreakDisplay progress={progress} />}

      {/* ⭐ NEW: Continue Your Journey Card */}
      {nextLesson && (
        <div className="next-up-card">
          <h2>Continue Your Journey</h2>
          <p>
            Lesson {nextLesson.order}: {nextLesson.title}
          </p>
          <Link
            to={`/viewer?order=${nextLesson.order}`}
            className="next-up-button"
          >
            Continue →
          </Link>
        </div>
      )}

      <DashboardCard title="Lessons" collapsible>
        <div className="lessons-grid" id="lessons">
          {lessons.map((lesson) => {
            const isUnlocked =
              lesson.order === 1 ||
              progress?.unlockedLessons?.includes(lesson.order) ||
              progress?.completedLessons?.includes(lesson.order);

            const toggleSaveLesson = async (lessonId) => {
              try {
                const isSaved = savedItems.includes(lessonId);
                const method = isSaved ? "DELETE" : "POST";
                const url = isSaved
                  ? `${apiUrl}/api/users/saved/${lessonId}`
                  : `${apiUrl}/api/users/saved`;

                const res = await fetch(url, {
                  method,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${effectiveToken}`,
                  },
                  body: method === "POST" ? JSON.stringify({ lessonId }) : null,
                });

                if (!res.ok) throw new Error("Failed to update saved lessons");
                const data = await res.json();
                setSavedItems(data.items || []);
              } catch (err) {
                console.error("Error toggling saved lesson:", err);
                setSavedError("Could not update saved lessons.");
              }
            };

            return (
              <div
                key={lesson._id}
                className={`lesson-card ${isUnlocked ? "unlocked" : "locked"}`}
              >
                {isUnlocked ? (
                  <>
                    <Link to={`/viewer?order=${lesson.order}`}>
                      <h3>
                        Lesson {lesson.order}
                        {lesson.order === nextLessonOrder && (
                          <span className="next-up-tag">Next Up</span>
                        )}
                      </h3>
                      <p>{lesson.title}</p>
                    </Link>

                    <button
                      onClick={() => toggleSaveLesson(lesson._id)}
                      className="save-btn"
                      style={{
                        marginTop: "0.5rem",
                        background: savedItems.includes(lesson._id)
                          ? "#888"
                          : "#63372c",
                        color: "white",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {savedItems.includes(lesson._id) ? "Unsave" : "Save"}
                    </button>
                  </>
                ) : (
                  <div className="locked-lesson">
                    <h3 style={{ color: "gray" }}>Lesson {lesson.order}</h3>
                    <p style={{ color: "gray" }}>
                      {lesson.title} <span>Locked</span>
                    </p>
                    <small style={{ color: "#888" }}>
                      Complete previous lessons to unlock
                    </small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DashboardCard>

      {/* 🔧 Updated Saved Section */}
      <DashboardCard title="Saved Recipes & Lessons" collapsible>
        <div id="member-saved">
          {loadingSaved && <p>Loading saved lessons...</p>}
          {savedError && <Alert type="error" message={savedError} />}
          {savedItems.length === 0 && !loadingSaved ? (
            <p>No saved lessons yet. Save one from the Lesson Viewer!</p>
          ) : (
            <ul className="saved-list">
              {savedItems.map((lessonId) => {
                const lesson = lessons.find((l) => l._id === lessonId);
                if (!lesson) return null; // ⬅️ nothing rendered if lesson not found

                const removeLesson = async () => {
                  const confirmRemove = window.confirm(
                    `Are you sure you want to remove Lesson ${lesson.order}: ${lesson.title} from your dashboard?`
                  );
                  if (!confirmRemove) return;

                  try {
                    const res = await fetch(
                      `${apiUrl}/api/users/saved/${lessonId}`,
                      {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${effectiveToken}` },
                      }
                    );
                    if (!res.ok) throw new Error("Failed to remove lesson");
                    const data = await res.json();
                    setSavedItems(data.items || []);
                  } catch (err) {
                    console.error("Error removing saved lesson:", err);
                    setSavedError("Failed to remove lesson.");
                  }
                };

                return (
                  <li key={lessonId}>
                    <Link to={`/viewer?order=${lesson.order}`}>
                      Lesson {lesson.order}: {lesson.title}
                    </Link>
                    <button onClick={removeLesson} style={{
                      marginLeft: "1rem",
                      background: "#63372c",
                      color: "white",
                      border: "none",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}>Remove</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Preferences" collapsible>
        <form className="preferences-form" id="preferences">
          <label>
            Cooking Goals:
            <select
              value={preferences.goal}
              onChange={(e) =>
                setPreferences({ ...preferences, goal: e.target.value })
              }
            >
              <option value="meal-prep">Meal Prep in Bundles</option>
              <option value="quick-meals">Quick Weeknight Meals</option>
              <option value="gourmet">Gourmet Cooking</option>
              <option value="skills">Improve Cooking Skills</option>
            </select>
          </label>

          <fieldset>
            <legend>Diet Types:</legend>
            {["vegetarian", "low-carb", "gluten-free"].map((diet) => (
              <label key={diet}>
                <input
                  type="checkbox"
                  checked={preferences.diets.includes(diet)}
                  onChange={(e) => {
                    const diets = [...preferences.diets];
                    if (e.target.checked) diets.push(diet);
                    else {
                      const idx = diets.indexOf(diet);
                      if (idx > -1) diets.splice(idx, 1);
                    }
                    setPreferences({ ...preferences, diets });
                  }}
                />
                {diet.replace("-", " ")}
              </label>
            ))}
          </fieldset>

          <button type="button" onClick={savePreferences} disabled={savingPrefs}>
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </button>
          {prefsMessage && (
            <Alert
              type={prefsMessage.includes("saved") ? "success" : "error"}
              message={prefsMessage}
            />
          )}
        </form>
      </DashboardCard>

      <DashboardCard title="Account Settings" collapsible>
        <form className="account-settings-form" id="account-settings">
          <label>
            Name:
            <input
              type="text"
              value={account.name || ""}
              onChange={(e) =>
                setAccount({ ...account, name: e.target.value })
              }
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={account.email || ""}
              onChange={(e) =>
                setAccount({ ...account, email: e.target.value })
              }
            />
          </label>

          <label>
            New Password:
            <input
              type="password"
              value={account.password || ""}
              onChange={(e) =>
                setAccount({ ...account, password: e.target.value })
              }
            />
          </label>

          <label>
            Avatar:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setAccount({ ...account, avatar: reader.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>

          {account.avatar && typeof account.avatar === "string" && (
            <img
              src={account.avatar}
              alt="User avatar preview"
              className="avatar-preview"
              style={{ width: 96, height: 96, borderRadius: "50%", marginTop: 8 }}
            />
          )}

          <button
            type="button"
            onClick={saveAccountSettings}
            disabled={savingAccount}
          >
            {savingAccount ? "Saving..." : "Save Changes"}
          </button>
          {accountMessage && (
            <Alert
              type={accountMessage.includes("updated") ? "success" : "error"}
              message={accountMessage}
            />
          )}
        </form>
      </DashboardCard>
    </div>
  );
}
