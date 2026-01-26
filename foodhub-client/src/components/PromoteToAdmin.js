import { useState, useEffect } from "react";
import React from "react";

export default function PromoteToAdmin({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const effectiveToken =
          token || localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!effectiveToken) throw new Error("No token available");

        const res = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load users: ${text}`);
        }

        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        console.error("❌ Error loading users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [token]);

  const promoteUser = async () => {
    if (!selectedUser) return;
    setPromoting(true);

    try {
      const effectiveToken =
        token || localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(
        `http://localhost:5000/api/admin/users/${selectedUser}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "admin" }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to promote user: ${text}`);
      }

      const updatedUser = await res.json();
      alert("✅ User promoted to admin successfully!");

      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
    } catch (err) {
      console.error("❌ Error promoting user:", err);
      alert("Could not promote user.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="promote-to-admin">
      <h2>Promote to Admin</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <label>
            Select user:
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {`${user.firstName || ""} ${user.lastName || ""}`} ({user.email}){" "}
                  {user.role === "admin" ? "⭐" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={promoteUser}
            disabled={!selectedUser || promoting}
            className="action-btn"
          >
            {promoting ? "Promoting..." : "Promote to Admin"}
          </button>
        </>
      )}
    </div>
  );
}