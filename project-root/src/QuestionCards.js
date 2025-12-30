export default function QuestionCard({ question, answer, onChange }) {
  return React.createElement(
    "div",
    { className: "quiz-question" },
    React.createElement("label", null, question.question),

    Array.isArray(question.options) && question.options.length > 0
      ? React.createElement(
          "div",
          null,
          question.options.map((opt, idx) =>
            React.createElement(
              "div",
              { key: idx },
              React.createElement("input", {
                type: "radio",
                name: `question-${question._id || question.question}`,
                value: idx,
                checked: String(answer) === String(idx),
                onChange: (e) => onChange(e.target.value),
              }),
              React.createElement("span", null, opt)
            )
          )
        )
      : React.createElement("input", {
          type: "text",
          className: "quiz-answer",
          value: answer || "",
          onChange: (e) => onChange(e.target.value),
        })
  );
}