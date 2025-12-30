import React from "react";
import "../styles/lesson.css";

export default function Quiz({ quiz, answers, onAnswerChange }) {
  if (!quiz || quiz.length === 0) return null;

  return (
    <section className="quiz-section">
      <h3>Quiz</h3>
      <ul>
        {quiz.map((q, idx) => (
          <li key={idx}>
            <label>{q.question}</label>
            <input
              type="text"
              value={answers[idx] || ""}
              onChange={(e) => onAnswerChange(idx, e.target.value)}
              className="form-input"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}