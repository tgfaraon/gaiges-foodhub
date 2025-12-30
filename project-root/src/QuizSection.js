import QuestionCard from "./QuestionCards.js";

export default function QuizSection({ quiz = [], answers = [], onAnswerChange }) {
  if (!quiz.length) {
    return React.createElement("div", null, "No quiz available for this lesson.");
  }

  return React.createElement(
    "div",
    { id: "quiz-questions" },
    React.createElement("h3", null, "Lesson Quiz"),
    quiz.map((q, idx) =>
      React.createElement(QuestionCard, {
        key: idx,
        question: q,
        answer: answers[idx] || null,
        onChange: (val) => onAnswerChange && onAnswerChange(idx, val),
      })
    )
  );
}