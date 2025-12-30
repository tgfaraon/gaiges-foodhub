document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Helper: get lessonId from URL (?id=<Mongo _id>)
  function getLessonIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) return id; // ?id=<Mongo _id>

  // fallback: last path segment
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1];
}
  async function loadLesson() {
    const lessonId = getLessonIdFromUrl();

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const lesson = await res.json();

      // Populate lesson content
      document.getElementById('lesson-title').textContent = lesson.title || '';
      document.getElementById('lesson-content').textContent = lesson.content || '';

      // Video embed
      const videoContainer = document.getElementById('video-container');
      videoContainer.innerHTML = lesson.videoUrl
        ? `<iframe src="${lesson.videoUrl}" frameborder="0" allowfullscreen></iframe>`
        : '';

      // Quiz rendering
      const quizSection = document.getElementById('quiz-questions');
      quizSection.innerHTML = '';
      (lesson.quiz || []).forEach((q, idx) => {
        const div = document.createElement('div');
        div.classList.add('quiz-question');
        div.innerHTML = `
          <label>${q.question}</label>
          <input type="text" class="quiz-answer" data-index="${idx}" />
        `;
        quizSection.appendChild(div);
      });

      // Store Mongo _id for submission
      document.querySelector('.lesson-viewer').setAttribute('data-lesson-id', lesson._id);

    } catch (err) {
      console.error('Error loading lesson:', err);
      document.getElementById('lesson-title').textContent = 'Failed to load lesson';
    }
  }

  // ✅ Submission handler
  const submitBtn = document.getElementById('submit-quiz');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const lessonId = document.querySelector('.lesson-viewer').getAttribute('data-lesson-id');

      // Collect quiz answers
      const answers = [...document.querySelectorAll('.quiz-answer')].map(input => input.value);

      // Build FormData for file + answers
      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));
      const fileInput = document.getElementById('workFile');
      if (fileInput && fileInput.files[0]) {
        formData.append('workFile', fileInput.files[0]);
      }

      try {
        const res = await fetch(`/api/memberLessons/${lessonId}/submit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Render results nicely
        document.getElementById('quiz-result').innerHTML = `
          <h3>Results</h3>
          <ul class="results-list">
            ${data.gradingResults.map(r => `
              <li class="${r.correct ? 'correct' : 'incorrect'}">
                <strong>${r.question}</strong><br/>
                Your answer: ${r.userAnswer} 
                ${r.correct ? '✅ Correct' : '❌ Incorrect'}<br/>
                ${r.explanation ? `<em>${r.explanation}</em>` : ''}
              </li>
            `).join('')}
          </ul>
        `;

        alert(data.message);

        if (data.nextLessonId) {
          window.location.href = `/lessons/lesson-viewer.html?id=${data.nextLessonId}`;
        } else {
          alert('🎉 All lessons complete!');
        }
      } catch (err) {
        console.error('Submission failed:', err);
        alert(`Failed to submit lesson: ${err.message}`);
      }
    });
  } else {
    console.error('Submit button not found in DOM');
  }

  // Initial load
  loadLesson();
});