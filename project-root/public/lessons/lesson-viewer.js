document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Get lesson ID from query string
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get('id');

  try {
    const res = await fetch(`/api/lessons/${lessonId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lesson = await res.json();

    // Populate lesson content
    document.getElementById('lesson-title').textContent = lesson.title;
    document.getElementById('lesson-content').textContent = lesson.content;

    // Embed YouTube video
    if (lesson.videoUrl) {
      const videoId = new URL(lesson.videoUrl).searchParams.get('v');
      document.getElementById('video-container').innerHTML =
        `<iframe width="560" height="315"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0" allowfullscreen></iframe>`;
    }

    // Render quiz questions
    const quizContainer = document.getElementById('quiz-questions');
    lesson.quiz?.forEach((q, idx) => {
      const div = document.createElement('div');
      div.className = 'quiz-question';
      div.innerHTML = `
        <p>${idx + 1}. ${q.question}</p>
        ${q.options.map((opt, i) =>
          `<label><input type="radio" name="q${idx}" value="${i}"> ${opt}</label><br>`
        ).join('')}
      `;
      quizContainer.appendChild(div);
    });

    // Handle quiz submission
    document.getElementById('submit-quiz').addEventListener('click', () => {
      let score = 0;
      lesson.quiz?.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected && parseInt(selected.value) === q.correctAnswer) {
          score++;
        }
      });
      document.getElementById('quiz-result').textContent =
        `You scored ${score} out of ${lesson.quiz?.length || 0}`;
    });

  } catch (err) {
    console.error('Error loading lesson:', err);
    document.getElementById('lesson-title').textContent = 'Lesson not found';
  }
});