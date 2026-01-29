import { useState, useEffect } from "react";
import React from "react";

export default function LessonPreview({ token }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  // Resolve effective token from prop or storage
  const effectiveToken =
    token || localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    const loadLessons = async () => {
      try {
        if (!effectiveToken) throw new Error("No token available");

        const res = await fetch(`${apiUrl}/api/lessons`, {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load lessons");
        const data = await res.json();

        // Sort by order to ensure consistent display
        const sorted = (data || []).sort((a, b) => a.order - b.order);
        setLessons(sorted);
      } catch (err) {
        console.error("❌ Error loading lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [effectiveToken]);

  const editLesson = (lesson) => {
    window.dispatchEvent(
      new CustomEvent("admin:edit-lesson", { detail: { lesson } })
    );

    window.dispatchEvent(
      new CustomEvent("admin:edit-quiz", {
        detail: { quiz: lesson.quiz || [], lessonId: lesson._id },
      })
    );
  };

  const requestDelete = (lesson) => {
    setConfirmDelete(lesson);
  };

  const confirmDeleteLesson = async () => {
    if (!confirmDelete) return;

    try {
      if (!effectiveToken) throw new Error("No token available");

      const res = await fetch(
        `${apiUrl}/api/lessons/${confirmDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        }
      );

      if (!res.ok) throw new Error(`Failed to delete lesson ${confirmDelete._id}`);

      setLessons((prev) => prev.filter((l) => l._id !== confirmDelete._id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("❌ Error deleting lesson:", err);
      alert("Failed to delete lesson.");
    }
  };

  const createNewLesson = () => {
    window.dispatchEvent(
      new CustomEvent("admin:edit-lesson", {
        detail: {
          lesson: {
            title: "",
            introduction: "",
            content: "",
            difficulty: "",
            tags: [],
            time: "",
            youtubeId: "",
            quiz: [],
            order: lessons.length + 1,
            curriculumGroup: "",
            sections: [],
          },
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent("admin:edit-quiz", {
        detail: { quiz: [], lessonId: null },
      })
    );
  };

  return (
    <div className="lesson-preview">
      <h2>Lesson Preview</h2>

      <button onClick={createNewLesson} className="action-btn">
        + Create New Lesson
      </button>

      {loading ? (
        <p>Loading lessons...</p>
      ) : (
        <div className="lesson-preview-wrapper">
          <table className="lesson-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan="6">No lessons found.</td>
                </tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson._id}>
                    <td>{lesson.order}</td>

                    <td>
                      <strong>{lesson.title}</strong>
                      {lesson.introduction && (
                        <div className="lesson-intro-preview">
                          {lesson.introduction.length > 80
                            ? lesson.introduction.slice(0, 80) + "..."
                            : lesson.introduction}
                        </div>
                      )}
                    </td>

                    <td>{lesson.difficulty}</td>
                    <td>{lesson.tags?.join(", ")}</td>
                    <td>{lesson.time}</td>

                    <td>
                      <button
                        onClick={() => editLesson(lesson)}
                        className="action-btn"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => requestDelete(lesson)}
                        className="action-btn delete"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() =>
                          (window.location.href = `/viewer?order=${lesson.order}`)
                        }
                        className="action-btn"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete lesson "
              <strong>{confirmDelete.title}</strong>"?
            </p>

            <div className="modal-actions">
              <button
                onClick={confirmDeleteLesson}
                className="action-btn delete"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setConfirmDelete(null)}
                className="action-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}