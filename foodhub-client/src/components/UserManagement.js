import { useState, useEffect } from "react";
import React from "react";

export default function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const effectiveToken =
          token || localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!effectiveToken) throw new Error("No token available");

        const res = await fetch(`${apiUrl}/api/admin/users`, {
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

  const promoteToAdmin = async (userId) => {
    try {
      const effectiveToken =
        token || localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to promote user: ${text}`);
      }

      const updatedUser = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
    } catch (err) {
      console.error("❌ Error promoting user:", err);
    }
  };

  const deactivateUser = async (userId) => {
    try {
      const effectiveToken =
        token || localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/deactivate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to deactivate user: ${text}`);
      }

      const updatedUser = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
    } catch (err) {
      console.error("❌ Error deactivating user:", err);
    }
  };

  const reactivateUser = async (userId) => {
    try {
      const effectiveToken =
        token || localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/reactivate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to reactivate user: ${text}`);
      }

      const updatedUser = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
    } catch (err) {
      console.error("❌ Error reactivating user:", err);
    }
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="avatar"
                          className="user-avatar"
                          style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{`${user.firstName || ""} ${user.lastName || ""}`}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.active ? "Active" : "Inactive"}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => promoteToAdmin(user._id)}
                          className="action-btn"
                        >
                          Promote
                        </button>
                      )}
                      {user.active ? (
                        <button
                          onClick={() => deactivateUser(user._id)}
                          className="action-btn delete"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivateUser(user._id)}
                          className="action-btn"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}