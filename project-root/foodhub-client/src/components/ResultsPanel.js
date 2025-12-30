import React from "react";

export default function ResultsPanel({ results }) {
  if (!results || !Array.isArray(results)) {
    return null;
  }

  return (
    <section className="results-panel">
      <h3>Quiz Results</h3>
      {results.map((res, idx) => (
        <div key={idx} className={`result-item ${res.correct ? "correct" : "incorrect"}`}>
          <p>
            <strong>Question {idx + 1}:</strong>{" "}
            {res.correct ? "✅ Correct" : "❌ Incorrect"}
          </p>

          {/* Feedback logic */}
          {res.correct && res.explanation && (
            <p className="explanation">Explanation: {res.explanation}</p>
          )}
          {!res.correct && res.hint && (
            <p className="hint">Hint: {res.hint}</p>
          )}

          {/* Optional AI feedback if provided */}
          {res.feedback && (
            <p className="feedback">Feedback: {res.feedback}</p>
          )}
        </div>
      ))}
    </section>
  );
}