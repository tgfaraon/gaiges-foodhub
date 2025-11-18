document.getElementById('complete-lesson')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) return alert('Missing token. Please log in again.');

  try {
    const response = await fetch('/api/progress/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lessonId: 'lesson-3', progress: 100 })
    });

    const result = await response.json();
    if (result.success) {
      alert('🎉 Lesson 3 marked complete!');
      window.location.href = '/members.html';
    } else {
      alert('Error saving progress: ' + result.error);
    }
  } catch (err) {
    console.error('Request failed:', err);
    alert('Something went wrong. Please try again.');
  }
});