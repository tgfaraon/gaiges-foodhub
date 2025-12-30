import React from 'react';
import './ProgressBar.css'; // optional styling

const ProgressBar = ({ percentage }) => {
  return (
    <div className="progress-container">
      <div
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      >
        <span className="progress-label">{percentage}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;