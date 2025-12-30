import React, { useState, useEffect } from "react";
import ResultsPanel from "./ResultsPanel";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/forms.css";

export default function LessonViewer() {
  const [lesson, setLesson] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);

  // Quiz-related state
  const [quizFile, setQuizFile] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [nextLessonOrder, setNextLessonOrder] = useState(null);
  const [passed, setPassed] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  // Progress + error
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  // Media grading state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaFeedback, setMediaFeedback] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const order = params.get("order");


  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  useEffect(() => {
    async function loadLesson() {
      try {
        if (!order) {
          setError("No lesson order provided in URL.");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/lessons/order/${order}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 403) {
          const data = await res.json();
          setError(
            data.message ||
              "This lesson is locked until you complete the previous one."
          );
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load lesson: ${text}`);
        }

        const data = await res.json();
        setLesson(data);

        // Reset quiz + media state on lesson change
        setAnswers(Array((data.quiz || []).length).fill(""));
        setQuizSubmitted(false);
        setNextLessonOrder(null);
        setPassed(false);
        setAllCorrect(false);
        setResults(null);
        setQuizFile(null);

        setMediaFile(null);
        setMediaFeedback(null);
        setMediaError(null);
        setMediaLoading(false);

        setError(null);
        setProgress(data.progress || null);
      } catch (err) {
        console.error("Error loading lesson:", err);
        setError(`Failed to load lesson: ${err.message}`);
      }
    }

    if (token) {
      loadLesson();
    }
  }, [order, token]);

  const handleSaveLesson = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/memberLessons/save/${lesson._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save lesson: ${text}`);
      }

      alert("✅ Saved to your lessons!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save lesson.");
    }
  };

  const handleAnswerChange = (idx, value) => {
    const updated = [...answers];
    updated[idx] = value;
    setAnswers(updated);
  };

  // Quiz file upload (only used when lesson.supportsQuizFileUpload === true)
  const handleQuizFileChange = (e) => setQuizFile(e.target.files[0] || null);

  const handleSubmitQuiz = async () => {
    if (!lesson?._id) return;

    try {
      const formData = new FormData();
      formData.append("answers", JSON.stringify(answers));

      // Only attach quiz file if present
      if (quizFile) formData.append("workFile", quizFile);

      const res = await fetch(
        `http://localhost:5000/api/memberLessons/${lesson._id}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to submit lesson: ${text}`);
      }

      const data = await res.json();

      setResults(data.gradingResults || []);
      setProgress(data.progress || null);
      setQuizSubmitted(true);
      setNextLessonOrder(data.nextLessonOrder || null);

      setPassed(Boolean(data.passed));
      setAllCorrect(Boolean(data.allCorrect));
      setError(null);

      if (data.newlyAwarded?.length) {
        data.newlyAwarded.forEach((badge) => {
          alert(`🎉 You earned the "${badge}" badge!`);
        });
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError(`Failed to submit lesson: ${err.message}`);
    }
  };

  const handleRetryQuiz = () => {
    setQuizSubmitted(false);
    setResults(null);
    setPassed(false);
    setAllCorrect(false);
    setError(null);
    // Optionally reset answers:
    // setAnswers(Array((lesson.quiz || []).length).fill(""));
  };

  const goToNextLesson = () => {
    if (nextLessonOrder) navigate(`/viewer?order=${nextLessonOrder}`);
  };

  // Media grading handlers
  const handleMediaFileChange = (e) => {
    setMediaFile(e.target.files[0] || null);
    setMediaFeedback(null);
    setMediaError(null);
  };

  const handleSubmitMedia = async () => {
    if (!mediaFile) {
      setMediaError("Please select a photo or video first.");
      return;
    }

    try {
      setMediaLoading(true);
      setMediaError(null);

      const formData = new FormData();
      formData.append("media", mediaFile);

      const res = await fetch(
        "http://localhost:5000/api/lessons/submit-media",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to submit media: ${text}`);
      }

      const data = await res.json();
      setMediaFeedback(data.feedback || null);

      if (data.newlyAwarded?.length) {
        data.newlyAwarded.forEach((badge) => {
          alert(`🎉 You earned the "${badge}" badge!`);
        });
      }
      if (data.newlyUnlockedRecipes?.length) { 
        data.newlyUnlockedRecipes.forEach((lessonId) => { 
          alert(`🍽️ New Reward Recipe Unlocked! Lesson ${lessonId} is now available.`); 
        }); 
      }
    } catch (err) {
      console.error("Media submission failed:", err);
      setMediaError(`Failed to submit media: ${err.message}`);
    } finally {
      setMediaLoading(false);
    }
  };

  // Locked / error view
  if (error) {
    return (
      <div className="lesson-body lesson-locked">
        <h2>Lesson Locked</h2>
        <p>{error}</p>

        {progress && (
          <div className="progress-bar">
            <p>
              Progress: {progress.completedLessonsCount} /{" "}
              {progress.totalLessons}
            </p>
            <div className="bar">
              <div
                className="fill"
                style={{ width: `${progress.completionPercentage}%` }}
              >
                <span className="label">
                  {progress.completionPercentage}%
                </span>
              </div>
            </div>

            {progress.badges?.length > 0 && (
              <div className="badges">
                Badges earned: {progress.badges.join(", ")}
              </div>
            )}

            {progress.streakCount > 1 && (
              <div className="streak">🔥 {progress.streakCount}-day streak!</div>
            )}
          </div>
        )}

        <div className="lesson-nav">
          <button onClick={() => (window.location.href = "/lessons")}>
            ⬅ Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="lesson-body">Loading...</div>;
  }

  const showQuiz = Array.isArray(lesson.quiz) && lesson.quiz.length > 0;
  const showQuizFileUpload = lesson.supportsQuizFileUpload === true;
  const showMediaGrading = lesson.supportsMediaGrading === true;

  // NEW: derived arrays for new fields
  const learningObjectives = Array.isArray(lesson.whatYouWillLearn)
    ? lesson.whatYouWillLearn.filter(Boolean)
    : [];
  const ingredients = Array.isArray(lesson.ingredients)
    ? lesson.ingredients.filter(Boolean)
    : [];
  const tools = Array.isArray(lesson.tools)
    ? lesson.tools.filter(Boolean)
    : [];

  const estimatedTime = lesson.estimatedTime || lesson.time;

  return (
    <main className="lesson-body lesson-viewer" data-lesson-id={lesson._id}>
      {progress && (
        <div className="progress-bar">
          <p>
            Progress: {progress.completedLessonsCount} /{" "}
            {progress.totalLessons}
          </p>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${progress.completionPercentage}%` }}
            >
              <span className="label">
                {progress.completionPercentage}%
              </span>
            </div>
          </div>

          {progress.streakCount > 1 && (
            <div className="streak">🔥 {progress.streakCount}-day streak!</div>
          )}
        </div>
      )}

      <h1 className="lesson-title">{lesson.title}</h1>

      <div className="lesson-actions" style={{ marginBottom: "1rem" }}>
        <button className="subscribe-button" onClick={handleSaveLesson}>
          ⭐ Save Lesson
        </button>
      </div>

      <div className="lesson-info">
        <p>
          <strong>Difficulty:</strong> {lesson.difficulty}
        </p>
        <p>
          <strong>Tags:</strong>{" "}
          {Array.isArray(lesson.tags) ? lesson.tags.join(", ") : lesson.tags}
        </p>
        <p>
          <strong>Estimated Time:</strong> {estimatedTime}
        </p>
      </div>

      {/* Introduction */}
      {lesson.introduction && (
        <div className="lesson-introduction">
          <h2>Introduction</h2>
          <p>{lesson.introduction}</p>
        </div>
      )}

      {/* NEW: What You’ll Learn */}
      {learningObjectives.length > 0 && (
        <div className="lesson-what-youll-learn">
          <h2>What You’ll Learn</h2>
          <ul>
            {learningObjectives.map((item, idx) => (
              <li key={`learn-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* NEW: Ingredients & Tools */}
      {(ingredients.length > 0 || tools.length > 0) && (
        <div className="lesson-ingredients-tools">
          {ingredients.length > 0 && (
            <div className="lesson-ingredients">
              <h2>Ingredients</h2>
              <ul>
                {ingredients.map((item, idx) => (
                  <li key={`ing-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {tools.length > 0 && (
            <div className="lesson-tools">
              <h2>Tools</h2>
              <ul>
                {tools.map((item, idx) => (
                  <li key={`tool-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <div className="lesson-sections">
        {(lesson.sections || []).map((s, idx) => (
          <div key={idx} className="lesson-section">
            {s.sectionTitle && <h3>{s.sectionTitle}</h3>}
            {renderSectionContent(s.sectionContent)}
          </div>
        ))}
      </div>

      {/* YouTube Video */}
      {lesson.youtubeId && (
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
            frameBorder="0"
            allowFullScreen
            title="Lesson Video"
          />
        </div>
      )}

      {/* Quiz */}
      {showQuiz && (
        <section className="quiz-section">
          <details open={quizSubmitted}>
            <summary>
              <h3>Quiz (click to expand)</h3>
            </summary>

            {(lesson.quiz || []).map((q, idx) => {
              const feedback = results?.[idx];
              const isCorrect = feedback?.correct;

              return (
                <div key={idx} className="quiz-question">
                  <p>
                    <strong>Question {idx + 1}:</strong> {q.question}
                  </p>

                  <input
                    type="text"
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Type your answer..."
                    disabled={quizSubmitted}
                  />

                  {quizSubmitted && (
                    <div
                      className={`quiz-feedback ${
                        isCorrect ? "correct" : "incorrect"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <p>✅ Correct!</p>
                          {q.explanation && (
                            <p className="explanation">{q.explanation}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>❌ Incorrect</p>
                          {q.hint && <p className="hint">Hint: {q.hint}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </details>

          {quizSubmitted && results && (
            <div className="quiz-summary">
              <h4>Quiz Results</h4>
              <p>
                You answered {results.filter((r) => r.correct).length} /{" "}
                {results.length} questions correctly.
              </p>

              {!passed && (
                <p className="retry-message">
                  Review the hints above and try again to unlock the next lesson.
                </p>
              )}
            </div>
          )}

          {/* Quiz file upload (conditional) */}
          {showQuizFileUpload && (
            <div className="lesson-section">
              <label>Upload work file:</label>
              <input type="file" onChange={handleQuizFileChange} />
            </div>
          )}

          {/* Quiz actions */}
          <div className="lesson-actions">
            <button
              className="subscribe-button"
              onClick={handleSubmitQuiz}
              disabled={quizSubmitted && passed}
            >
              Submit Quiz
            </button>

            {quizSubmitted && passed && nextLessonOrder && (
              <button onClick={goToNextLesson}>Next Lesson ➡</button>
            )}
          </div>

          {/* Retry Button */}
          {quizSubmitted && !passed && (
            <button
              onClick={handleRetryQuiz}
              className="subscribe-button retry-btn"
            >
              Retry Quiz
            </button>
          )}
        </section>
      )}

      {/* Optional media grading section */}
      {showMediaGrading && (
        <section className="media-grading-section">
          <h3>Optional: Submit Photo or Video for Feedback</h3>
          <p className="media-description">
            Upload a photo or short video of your results so we can give you
            feedback on texture, consistency, and technique. This is optional
            and does not affect your ability to move forward.
          </p>

          <div className="lesson-section">
            <label>Select photo or video:</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaFileChange}
            />
          </div>

          <div className="lesson-actions">
            <button
              className="subscribe-button"
              onClick={handleSubmitMedia}
              disabled={mediaLoading}
            >
              {mediaLoading ? "Submitting..." : "Submit for Feedback"}
            </button>
          </div>

          {mediaError && (
            <p className="error-message" style={{ marginTop: "0.5rem" }}>
              {mediaError}
            </p>
          )}

          {mediaFeedback && (
            <div className="media-feedback">
              <h4>AI Feedback</h4>
              {typeof mediaFeedback === "string" ? (
                <p>{mediaFeedback}</p>
              ) : (
                <pre>{JSON.stringify(mediaFeedback, null, 2)}</pre>
              )}
            </div>
          )}
        </section>
      )}

      {/* Next Lesson button for reward lessons */}
      {lesson.order >= 101 && ( 
        <div className="lesson-actions"> 
          <button 
            className="subscribe-button" 
            onClick={() => navigate(`/viewer?order=${nextLessonOrder}`)} 
            > 
            Continue to Lesson {nextLessonOrder} ➡ 
          </button> 
        </div>
      )}

      {/* Navigation */}
      <div className="lesson-nav">
        <button onClick={() => (window.location.href = "/lessons")}>
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* Results Panel */}
      {results && <ResultsPanel results={results} />}
    </main>
  );
}

/* Section Content Renderer */
function renderSectionContent(content) {
  if (!content) return null;

  const trimmed = String(content).trim();
  const hasNumbered = /^\s*1\.\s/m.test(trimmed);
  const hasBullets = /^\s*-\s/m.test(trimmed);

  if (hasNumbered) {
    const items = trimmed
      .split(/\n?\d+\.\s+/)
      .filter(Boolean)
      .map((s) => s.trim());

    return (
      <ol>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }

  if (hasBullets) {
    const items = trimmed
      .split(/\n?-\s+/)
      .filter(Boolean)
      .map((s) => s.trim());

    return (
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim());

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}