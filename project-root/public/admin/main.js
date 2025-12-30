// --------------------
// Lesson Editor Component
// --------------------
function LessonEditorApp() {
  const [lesson, setLesson] = React.useState({
    _id: "",
    title: "",
    content: "",
    difficulty: "",
    tags: "",
    time: "",
    youtubeId: "",
    quiz: []
  });
  const [errors, setErrors] = React.useState({});
  const [preview, setPreview] = React.useState(false);

  // Listen for admin.js event when a lesson is selected for editing
  React.useEffect(() => {
    function handleEditLesson(e) {
      const lessonData = e.detail.lesson;
      setLesson({
        _id: lessonData._id || "",
        title: lessonData.title || "",
        content: lessonData.content || "",
        difficulty: lessonData.difficulty || "",
        tags: Array.isArray(lessonData.tags) ? lessonData.tags.join(", ") : (lessonData.tags || ""),
        time: lessonData.estimatedTime || lessonData.time || "",
        youtubeId: lessonData.youtubeId || "",
        quiz: Array.isArray(lessonData.quiz) ? lessonData.quiz : []
      });
      setErrors({});
      setPreview(false);
      console.log("✏️ Loaded lesson into editor:", lessonData);
    }
    window.addEventListener("admin:edit-lesson", handleEditLesson);
    return () => window.removeEventListener("admin:edit-lesson", handleEditLesson);
  }, []);

  function handleChange(e) {
    setLesson({ ...lesson, [e.target.name]: e.target.value });
  }

  function validate() {
    const newErrors = {};
    if (!lesson.title.trim()) newErrors.title = "Title is required.";
    if (!lesson.content.trim()) newErrors.content = "Content is required.";
    if (lesson.time && !/^\d+(\s*-\s*\d+)?(\s*minutes)?$/i.test(lesson.time.trim())) {
      newErrors.time = "Time must be a number or range (e.g., 30 or 30-45 minutes).";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("✅ Save button clicked, lesson state:", lesson);

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.warn("⚠️ Validation failed:", newErrors);
      return;
    }

    try {
      const method = lesson._id ? "PUT" : "POST";
      const url = lesson._id ? `/api/lessons/${lesson._id}` : "/api/lessons";

      console.log(`📡 Sending ${method} request to ${url}`);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...lesson,
          tags: lesson.tags.split(",").map(t => t.trim())
        })
      });

      if (!res.ok) throw new Error(`Failed to save lesson: ${res.status} ${res.statusText}`);
      const data = await res.json();
      alert("Lesson saved successfully!");
      console.log("✅ Saved lesson:", data);

      // Dispatch event so preview refreshes
      window.dispatchEvent(new Event("admin:lesson-saved"));
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("Error saving lesson: " + err.message);
    }
  }

  // Quiz builder helpers
  function addQuestion() {
    setLesson({
      ...lesson,
      quiz: [
        ...lesson.quiz,
        { question: "", options: ["", ""], correctAnswer: "", acceptedKeywords: [], explanation: "", hint: "", tag: "" }
      ]
    });
  }

  function updateQuestion(index, field, value) {
    const updatedQuiz = [...lesson.quiz];
    updatedQuiz[index][field] = value;
    setLesson({ ...lesson, quiz: updatedQuiz });
  }

  function updateOption(index, optIndex, value) {
    const updatedQuiz = [...lesson.quiz];
    updatedQuiz[index].options[optIndex] = value;
    setLesson({ ...lesson, quiz: updatedQuiz });
  }

  // Preview mode
  if (preview) {
    return React.createElement(
      "div",
      { className: "lesson-preview" },
      React.createElement("h2", null, lesson.title),
      React.createElement("p", null, `Difficulty: ${lesson.difficulty}`),
      React.createElement("p", null, `Time: ${lesson.time}`),
      React.createElement("p", null, `Tags: ${lesson.tags}`),
      React.createElement("div", { className: "lesson-content" }, lesson.content),
      lesson.youtubeId && React.createElement("iframe", {
        src: `https://www.youtube.com/embed/${lesson.youtubeId}`,
        allowFullScreen: true
      }),
      React.createElement("h3", null, "Quiz"),
      lesson.quiz.map((q, idx) =>
        React.createElement("div", { key: idx },
          React.createElement("strong", null, q.question),
          React.createElement("p", null, `Hint: ${q.hint || "—"}`)
        )
      ),
      React.createElement("button", { onClick: () => setPreview(false) }, "← Back to Edit")
    );
  }

  // Editor form
  return React.createElement(
    "div",
    { className: "editor-container" },
    React.createElement("h2", { className: "editor-title" }, lesson._id ? "Edit Lesson" : "Create Lesson"),
    React.createElement(
      "form",
      { id: "lesson-form", className: "editor-form", onSubmit: handleSubmit },
      // Core info
      React.createElement("div", { className: "form-group" },
        React.createElement("label", null, "Title"),
        React.createElement("input", { type: "text", name: "title", value: lesson.title, onChange: handleChange }),
        errors.title && React.createElement("div", { className: "error" }, errors.title)
      ),
      React.createElement("div", { className: "form-group" },
        React.createElement("label", null, "Content"),
        React.createElement("textarea", { name: "content", value: lesson.content, onChange: handleChange }),
        errors.content && React.createElement("div", { className: "error" }, errors.content)
      ),

      // Metadata
      React.createElement("div", { className: "form-row" },
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "Difficulty"),
          React.createElement("input", { type: "text", name: "difficulty", value: lesson.difficulty, onChange: handleChange })
        ),
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "Tags"),
          React.createElement("input", { type: "text", name: "tags", value: lesson.tags, onChange: handleChange })
        )
      ),
      React.createElement("div", { className: "form-row" },
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "Time (minutes)"),
          React.createElement("input", { type: "text", name: "time", value: lesson.time, onChange: handleChange }),
          errors.time && React.createElement("div", { className: "error" }, errors.time)
        ),
        React.createElement("div", { className: "form-group" },
          React.createElement("label", null, "YouTube Video ID"),
          React.createElement("input", { type: "text", name: "youtubeId", value: lesson.youtubeId, onChange: handleChange })
        )
      ),

      // Quiz builder
      React.createElement("div", { className: "form-group" },
        React.createElement("label", null, "Quiz Questions"),
        lesson.quiz.map((q, idx) =>
          React.createElement("div", { key: idx, className: "quiz-builder" },
            React.createElement("input", {
              type: "text",
              placeholder: "Question text",
              value: q.question,
              onChange: e => updateQuestion(idx, "question", e.target.value)
            }),
            q.options.map((opt, i) =>
              React.createElement("input", {
                key: i,
                type: "text",
                placeholder: `Option ${i + 1}`,
                value: opt,
                onChange: e => updateOption(idx, i, e.target.value)
              })
            ),
            React.createElement("input", {
              type: "text",
              placeholder: "Correct Answer",
              value: q.correctAnswer,
              onChange: e => updateQuestion(idx, "correctAnswer", e.target.value)
            }),
            React.createElement("input", {
              type: "text",
              placeholder: "Accepted Keywords (comma separated)",
              value: q.acceptedKeywords.join(", "),
              onChange: e => updateQuestion(idx, "acceptedKeywords", e.target.value.split(",").map(s => s.trim()))
            }),
            React.createElement("textarea", {
              placeholder: "Explanation",
              value: q.explanation,
              onChange: e => updateQuestion(idx, "explanation", e.target.value)
            }),
            React.createElement("input", {
              type: "text",
              placeholder: "Tag",
              value: q.tag,
              onChange: e => updateQuestion(idx, "tag", e.target.value)
            })
          )
        ),
        React.createElement("button", { type: "button", onClick: addQuestion }, "+ Add Question")
      ),

      React.createElement("button", { type: "submit", className: "editor-button" }, "Save Lesson")
    )
  );
}
// --------------------
// Lesson Preview Component
// --------------------
function LessonPreviewApp() {
  const [lessons, setLessons] = React.useState([]);

  function fetchLessons() {
    fetch("/api/lessons", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch lessons");
        return res.json();
      })
      .then(data => setLessons(data))
      .catch(err => console.error("Lesson fetch error:", err));
  }

  React.useEffect(() => {
    fetchLessons();
    window.addEventListener("admin:lesson-saved", fetchLessons);
    return () => window.removeEventListener("admin:lesson-saved", fetchLessons);
  }, []);

  return React.createElement(
    "tbody",
    null,
    lessons.length
      ? lessons.map(lesson =>
          React.createElement(
            "tr",
            { key: lesson._id },
            React.createElement("td", null, lesson.title),
            React.createElement("td", null, lesson.difficulty || "—"),
            React.createElement("td", null, Array.isArray(lesson.tags) ? lesson.tags.join(", ") : (lesson.tags || "—")),
            React.createElement("td", null, lesson.estimatedTime || lesson.time || "—"),
            React.createElement(
              "td",
              null,
              React.createElement(
                "button",
                { onClick: () => viewLesson(lesson._id) }, // NEW: open viewer
                "View"
              ),
              " ",
              React.createElement(
                "button",
                { onClick: () => editLesson(lesson._id) },
                "Edit"
              ),
              " ",
              React.createElement(
                "button",
                { onClick: () => deleteLesson(lesson._id) },
                "Delete"
              )
            )
          )
        )
      : React.createElement(
          "tr",
          null,
          React.createElement("td", { colSpan: 5 }, "No lessons found.")
        )
  );
}

// --------------------
// Lesson Viewer Component
// --------------------
function LessonViewerApp({ lessonId }) {
  const [lesson, setLesson] = React.useState(null);

  React.useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch lesson");
        return res.json();
      })
      .then(data => setLesson(data))
      .catch(err => console.error("Lesson viewer fetch error:", err));
  }, [lessonId]);

  if (!lesson) return React.createElement("div", null, "Loading lesson...");

  return React.createElement(
    "div",
    { className: "lesson-viewer" },
    React.createElement("h2", null, lesson.title),
    React.createElement("p", null, lesson.content),
    React.createElement("h3", null, "Quiz"),
    React.createElement(
      "ul",
      null,
      lesson.quiz && lesson.quiz.map((q, idx) =>
        React.createElement("li", { key: idx },
          React.createElement("strong", null, q.question),
          React.createElement("ul", null,
            q.options.map((opt, i) =>
              React.createElement("li", { key: i }, opt)
            )
          )
        )
      )
    )
  );
}

// --------------------
// Mount both components
// --------------------
const editorRoot = document.getElementById("lesson-editor-root");
if (editorRoot) {
  const root = ReactDOM.createRoot(editorRoot);
  root.render(React.createElement(LessonEditorApp));
}

const previewRoot = document.getElementById("lesson-preview");
if (previewRoot) {
  const root = ReactDOM.createRoot(previewRoot);
  root.render(React.createElement(LessonPreviewApp));
}