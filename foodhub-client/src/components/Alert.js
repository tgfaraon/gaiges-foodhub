import React from "react";

export default function Alert({ type = "info", message }) {
  if (!message) return null;

  const colors = {
    success: "#2e7d32",
    error: "#c62828",
    info: "#1565c0",
  };

  return (
    <div
      style={{
        background: `${colors[type]}20`, // light background tint
        border: `1px solid ${colors[type]}`,
        color: colors[type],
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        marginTop: "0.5rem",
      }}
    >
      {message}
    </div>
  );
}