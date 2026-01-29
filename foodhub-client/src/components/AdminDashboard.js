import { useEffect, useState } from "react";
import React from "react";
import DashboardCard from "./DashboardCard";
import LessonEditor from "./LessonEditor";
import QuizManager from "./QuizManager";
import LessonPreview from "./LessonPreview";
import UserAnalytics from "./UserAnalytics";
import UserManagement from "./UserManagement";
import SiteSettings from "./SiteSettings";
import PromoteToAdmin from "./PromoteToAdmin";

export default function AdminDashboard({ token }) {
  const effectiveToken =
    token || localStorage.getItem("token") || sessionStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analytics"); // tabs: analytics, management, promote

  const apiUrl = process.env.REACT_APP_API_URL;

  // Helper for authenticated fetch
  const fetchWithAuth = async (endpoint, options = {}) => {
    if (!effectiveToken) throw new Error("No token available");

    const res = await fetch(`${apiUrl}/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveToken}`,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Fetch failed:", res.status, text);
      throw new Error(text);
    }

    return res.json();
  };

  // Actions
  const promoteUser = async (id) => {
    try {
      const updated = await fetchWithAuth(`/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: "admin" }),
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: updated.role } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivateUser = async (id) => {
    try {
      const updated = await fetchWithAuth(`/admin/users/${id}/deactivate`, {
        method: "PUT",
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, active: updated.active } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const reactivateUser = async (id) => {
    try {
      const updated = await fetchWithAuth(`/admin/users/${id}/reactivate`, {
        method: "PUT",
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, active: updated.active } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Load data
  useEffect(() => {
    if (!effectiveToken) return;

    const fetchData = async () => {
      try {
        const analyticsData = await fetchWithAuth("/admin/analytics");
        setAnalytics(analyticsData);

        const usersData = await fetchWithAuth("/admin/users");
        setUsers(usersData);
      } catch (err) {
        setError("Failed to load admin data");
        console.error(err);
      }
    };

    fetchData();
  }, [effectiveToken]);

  return (
    <div className="dashboard">
      <h1>Gaige&apos;s Food Hub Admin Panel</h1>
      {error && <p className="error">{error}</p>}

      {/* Lesson Editor */}
      <DashboardCard title="✏️ Lesson Editor" collapsible>
        <LessonEditor token={effectiveToken} />
      </DashboardCard>

      {/* Quiz Manager */}
      <DashboardCard title="📝 Quiz Manager" collapsible>
        <QuizManager token={effectiveToken} />
      </DashboardCard>

      {/* Lesson Preview */}
      <DashboardCard title="📘 Lesson Preview" collapsible>
        <LessonPreview token={effectiveToken} />
      </DashboardCard>

      {/* Unified User Administration */}
      <DashboardCard title="👥 User Administration" collapsible>
        <div className="tabs">
          <button
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics
          </button>
          <button
            className={activeTab === "management" ? "active" : ""}
            onClick={() => setActiveTab("management")}
          >
            👥 Management
          </button>
          <button
            className={activeTab === "promote" ? "active" : ""}
            onClick={() => setActiveTab("promote")}
          >
            🛡️ Promote User
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "analytics" && analytics && (
            <UserAnalytics token={effectiveToken} analytics={analytics} />
          )}

          {activeTab === "management" && (
            <UserManagement
              token={effectiveToken}
              users={users}
              promoteUser={promoteUser}
              deactivateUser={deactivateUser}
              reactivateUser={reactivateUser}
            />
          )}

          {activeTab === "promote" && (
            <PromoteToAdmin
              token={effectiveToken}
              users={users}
              promoteUser={promoteUser}
            />
          )}
        </div>
      </DashboardCard>

      {/* Site Settings */}
      <DashboardCard title="⚙️ Site Settings" collapsible>
        <SiteSettings token={effectiveToken} />
      </DashboardCard>
    </div>
  );
}