import { useState } from "react";
import React from "react";

export default function DashboardCard({ title, children, collapsible = false }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="dashboard-card">
      <div
        className="dashboard-header"
        onClick={() => collapsible && setOpen(!open)}
        style={{ cursor: collapsible ? "pointer" : "default" }}
      >
        <h2>{title}</h2>
        {collapsible && <span>{open ? "▼" : "▶"}</span>}
      </div>
      {(!collapsible || open) && (
        <div className="dashboard-content">{children}</div>
      )}
    </div>
  );
}