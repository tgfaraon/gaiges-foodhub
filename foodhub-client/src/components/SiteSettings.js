import { useState, useEffect } from "react";
import React from "react";

export default function SiteSettings({ token }) {
  const [settings, setSettings] = useState({
    announcementsEnabled: false,
    maintenanceMode: false,
    announcementText: "",
  });

  const apiUrl = process.env.REACT_APP_API_URL;

  // Resolve effective token from prop or storage
  const effectiveToken =
    token || localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!effectiveToken) throw new Error("No token available");

        const res = await fetch(`${apiUrl}/api/settings`, {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load settings: ${text}`);
        }

        const data = await res.json();
        setSettings({
          announcementsEnabled: data.announcementsEnabled || false,
          maintenanceMode: data.maintenanceMode || false,
          announcementText: data.announcementText || "",
        });
      } catch (err) {
        console.error("❌ Error loading settings:", err);
      }
    };
    loadSettings();
  }, [effectiveToken]);

  const saveSettings = async (e) => {
    e.preventDefault();
    console.log("Saving settings:", settings);

    try {
      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(`${apiUrl}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save settings: ${text}`);
      }

      alert("✅ Settings saved successfully!");
    } catch (err) {
      console.error("❌ Error saving settings:", err);
      alert("Could not save settings.");
    }
  };

  return (
    <div className="site-settings">
      <h2>Site Settings</h2>
      <form onSubmit={saveSettings}>
        <label>
          <input
            type="checkbox"
            checked={settings.announcementsEnabled}
            onChange={(e) =>
              setSettings({ ...settings, announcementsEnabled: e.target.checked })
            }
          />
          Enable Announcements Banner
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) =>
              setSettings({ ...settings, maintenanceMode: e.target.checked })
            }
          />
          Enable Maintenance Mode
        </label>

        <label>
          Announcement Message:
          <textarea
            rows="4"
            value={settings.announcementText}
            onChange={(e) =>
              setSettings({ ...settings, announcementText: e.target.value })
            }
            placeholder="Enter site-wide announcement..."
          />
        </label>

        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
}