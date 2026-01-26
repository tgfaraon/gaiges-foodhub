import { useState, useEffect } from "react";
import React from "react";

export default function QuizManager({ token }) {
  const [quiz, setQuiz] = useState([]);
  const [lessonId, setLessonId] = useState(null);

  // Listen for admin:edit-quiz event
  useEffect(() => {
    function handleEditQuiz(e) {
      setQuiz(e.detail.quiz || []);
      setLessonId(e.detail.lessonId);
    }
    window.addEventListener("admin:edit-quiz", handleEditQuiz);
    return () => window.removeEventListener("admin:edit-quiz", handleEditQuiz);
  }, []);

  const handleChange = (idx, field, value) => {
    const updated = [...quiz];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuiz(updated);
  };

  const addQuestion = () => {
    setQuiz([
      ...quiz,
      {
        question: "",
        options: [],
        correctAnswer: "",
        acceptedKeywords: [],
        explanation: "",
        tag: "",
      },
    ]);
  };

  const removeQuestion = (idx) => {
    setQuiz(quiz.filter((_, i) => i !== idx));
  };

  const saveQuiz = async () => {
    if (!lessonId) {
      alert("No lesson selected.");
      return;
    }
    try {
      const effectiveToken =
        token ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!effectiveToken) {
        throw new Error("No token available");
      }

      const res = await fetch(
        `http://localhost:5000/api/lessons/${lessonId}/quiz`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({ quiz }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save quiz: ${text}`);
      }

      alert("✅ Quiz saved successfully!");
    } catch (err) {
      console.error("❌ Error saving quiz:", err);
      alert("Failed to save quiz.");
    }
  };

  return (
    <div className="quiz-manager">
      <h2>Quiz Manager</h2>
      {quiz.map((q, idx) => (
        <div key={idx} className="quiz-question">
          <label>Question:</label>
          <input
            value={q.question}
            onChange={(e) => handleChange(idx, "question", e.target.value)}
          />

          <label>Options (comma separated):</label>
          <input
            value={q.options.join(", ")}
            onChange={(e) =>
              handleChange(
                idx,
                "options",
                e.target.value.split(",").map((o) => o.trim())
              )
            }
          />

          <label>Correct Answer:</label>
          <input
            value={q.correctAnswer}
            onChange={(e) =>
              handleChange(idx, "correctAnswer", e.target.value)
            }
          />

          <label>Accepted Keywords (comma separated):</label>
          <input
            value={q.acceptedKeywords.join(", ")}
            onChange={(e) =>
              handleChange(
                idx,
                "acceptedKeywords",
                e.target.value.split(",").map((k) => k.trim())
              )
            }
          />

          <label>Explanation:</label>
          <textarea
            value={q.explanation}
            onChange={(e) => handleChange(idx, "explanation", e.target.value)}
          />

          <label>Tag:</label>
          <input
            value={q.tag}
            onChange={(e) => handleChange(idx, "tag", e.target.value)}
          />

          <button
            onClick={() => removeQuestion(idx)}
            className="action-btn delete"
          >
            Remove Question
          </button>
        </div>
      ))}
      <button onClick={addQuestion} className="action-btn">
        + Add Question
      </button>
      <button onClick={saveQuiz} className="action-btn">
        Save Quiz
      </button>
    </div>
  );
}