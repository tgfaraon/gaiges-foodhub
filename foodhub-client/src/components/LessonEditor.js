// LessonEditor.js
import React, { useState, useEffect } from "react";

function extractYouTubeId(url) {
  if (!url) return "";
  try {
    // Handle youtu.be links 
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].substring(0, 11);
    }

    // Handle watch?v= links 
    const urlObj = new URL(url);
    const v = urlObj.searchParams.get("v");
    if (v) return v.substring(0, 11);

    // Handle embed links 
    if (url.includes("/embed/")) {
      return url.split("/embed/")[1].substring(0, 11);
    }
  } catch (err) {
    // If user already entered a raw ID 
    if (url.length === 11) return url; return "";
  }

  return "";
}

export default function LessonEditor() {
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [order, setOrder] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [tags, setTags] = useState("");
  const [time, setTime] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [introduction, setIntroduction] = useState("");

  const [whatYouWillLearn, setWhatYouWillLearn] = useState([""]);
  const [ingredients, setIngredients] = useState([""]);
  const [tools, setTools] = useState([""]);

  const apiUrl = process.env.REACT_APP_API_URL;

  const [sections, setSections] = useState([
    { sectionTitle: "", sectionContent: "" },
  ]);

  // ---------------------------------------------------
  // Load lesson into editor when "admin:edit-lesson" fires
  // ---------------------------------------------------
  useEffect(() => {
    function handleEditLesson(e) {
      const l = e.detail.lesson || {};

      setEditingId(l._id || null);
      setTitle(l.title || "");
      setOrder(l.order ?? "");
      setDifficulty(l.difficulty || "easy");
      setTags(Array.isArray(l.tags) ? l.tags.join(", ") : "");
      setTime(l.time || "");
      setYoutubeId(l.youtubeId || "");
      setIntroduction(l.introduction || "");

      setWhatYouWillLearn(
        Array.isArray(l.whatYouWillLearn) && l.whatYouWillLearn.length
          ? l.whatYouWillLearn
          : [""]
      );

      setIngredients(
        Array.isArray(l.ingredients) && l.ingredients.length
          ? l.ingredients
          : [""]
      );

      setTools(
        Array.isArray(l.tools) && l.tools.length ? l.tools : [""]
      );

      setSections(
        Array.isArray(l.sections) && l.sections.length
          ? l.sections
          : [
            {
              sectionTitle: "Main",
              sectionContent: l.content || "",
            },
          ]
      );
    }

    window.addEventListener("admin:edit-lesson", handleEditLesson);
    return () =>
      window.removeEventListener("admin:edit-lesson", handleEditLesson);
  }, []);

  // ---------------------------------------------------
  // Helpers for list fields
  // ---------------------------------------------------
  const updateStringArrayItem = (arr, setter, idx, value) => {
    const updated = [...arr];
    updated[idx] = value;
    setter(updated);
  };

  const removeStringArrayItem = (arr, setter, idx) => {
    const updated = arr.filter((_, i) => i !== idx);
    setter(updated.length ? updated : [""]);
  };

  const addStringArrayItem = (arr, setter) => {
    setter([...arr, ""]);
  };

  // ---------------------------------------------------
  // Section handlers
  // ---------------------------------------------------
  const handleSectionChange = (idx, field, value) => {
    const updated = [...sections];
    updated[idx][field] = value;
    setSections(updated);
  };

  const addSection = () => {
    setSections([
      ...sections,
      { sectionTitle: "", sectionContent: "" },
    ]);
  };

  const removeSection = (idx) => {
    const updated = sections.filter((_, i) => i !== idx);
    setSections(updated.length ? updated : [
      { sectionTitle: "", sectionContent: "" },
    ]);
  };

  // ---------------------------------------------------
  // Save lesson
  // ---------------------------------------------------
  const handleSave = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");
      if (!token) throw new Error("No token available");

      const lessonData = {
        title,
        order: order ? Number(order) : undefined,
        difficulty,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        time,
        youtubeId: extractYouTubeId(youtubeId),
        introduction,
        whatYouWillLearn: whatYouWillLearn
          .map((item) => item.trim())
          .filter(Boolean),
        ingredients: ingredients
          .map((item) => item.trim())
          .filter(Boolean),
        tools: tools
          .map((item) => item.trim())
          .filter(Boolean),
        sections,
        curriculumGroup: "Basics",
        attachments: [],
      };

      const url = editingId
        ? `${apiUrl}/api/lessons/${editingId}`
        : "http://localhost:5000/api/lessons";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lessonData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      alert("✅ Lesson saved successfully!");

      // Keep quiz editor behavior, but do NOT wipe quiz
      window.dispatchEvent(
        new CustomEvent("admin:edit-quiz", {
          detail: { lessonId: data._id, quiz: data.quiz || [] },
        })
      );
    } catch (err) {
      console.error("❌ Error saving lesson:", err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------
  return (
    <div className="lesson-editor">
      <h2>{editingId ? "Edit Lesson" : "Create Lesson"}</h2>

      <input
        type="text"
        placeholder="Lesson title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="number"
        placeholder="Order"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
      />

      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
        <option value="advanced">Advanced</option>
      </select>

      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <input
        type="text"
        placeholder="Estimated time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <input
        type="text"
        placeholder="YouTube URL or ID"
        value={youtubeId}
        onChange={(e) => setYoutubeId(e.target.value)}
      />

      <textarea
        placeholder="Lesson introduction (short summary)"
        value={introduction}
        onChange={(e) => setIntroduction(e.target.value)}
        style={{ minHeight: "80px", marginTop: "10px" }}
      />

      {/* What You'll Learn */}
      <h3>What You'll Learn</h3>
      {whatYouWillLearn.map((item, idx) => (
        <div key={`learn-${idx}`} className="lesson-list-input">
          <input
            type="text"
            placeholder="Learning objective"
            value={item}
            onChange={(e) =>
              updateStringArrayItem(
                whatYouWillLearn,
                setWhatYouWillLearn,
                idx,
                e.target.value
              )
            }
          />
          <button
            type="button"
            onClick={() =>
              removeStringArrayItem(
                whatYouWillLearn,
                setWhatYouWillLearn,
                idx
              )
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          addStringArrayItem(whatYouWillLearn, setWhatYouWillLearn)
        }
      >
        + Add Learning Objective
      </button>

      {/* Ingredients */}
      <h3>Ingredients</h3>
      {ingredients.map((item, idx) => (
        <div key={`ing-${idx}`} className="lesson-list-input">
          <input
            type="text"
            placeholder="Ingredient"
            value={item}
            onChange={(e) =>
              updateStringArrayItem(
                ingredients,
                setIngredients,
                idx,
                e.target.value
              )
            }
          />
          <button
            type="button"
            onClick={() =>
              removeStringArrayItem(ingredients, setIngredients, idx)
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          addStringArrayItem(ingredients, setIngredients)
        }
      >
        + Add Ingredient
      </button>

      {/* Tools */}
      <h3>Tools</h3>
      {tools.map((item, idx) => (
        <div key={`tool-${idx}`} className="lesson-list-input">
          <input
            type="text"
            placeholder="Tool"
            value={item}
            onChange={(e) =>
              updateStringArrayItem(
                tools,
                setTools,
                idx,
                e.target.value
              )
            }
          />
          <button
            type="button"
            onClick={() =>
              removeStringArrayItem(tools, setTools, idx)
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addStringArrayItem(tools, setTools)}
      >
        + Add Tool
      </button>

      {/* Sections */}
      <h3>Lesson Sections</h3>
      {sections.map((s, idx) => (
        <div key={`section-${idx}`} className="lesson-section-editor">
          <input
            type="text"
            placeholder="Section title"
            value={s.sectionTitle}
            onChange={(e) =>
              handleSectionChange(idx, "sectionTitle", e.target.value)
            }
          />
          <textarea
            placeholder="Section content"
            value={s.sectionContent}
            onChange={(e) =>
              handleSectionChange(idx, "sectionContent", e.target.value)
            }
          />
          <button type="button" onClick={() => removeSection(idx)}>
            Remove Section
          </button>
        </div>
      ))}

      <button type="button" onClick={addSection}>
        + Add Section
      </button>

      <button type="button" onClick={handleSave}>
        Save Lesson
      </button>
    </div>
  );
}