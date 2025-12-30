import React from "react";
import "../styles/lesson.css";

export default function Modal({ show, onClose, title, children }) {
  return (
    <div className={`modal ${show ? "show" : "hidden"}`}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {title && <h3>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
}