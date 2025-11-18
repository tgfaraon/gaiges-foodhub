document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    console.error('Invalid token:', err);
    window.location.href = '/login.html';
    return;
  }

  // 🔐 Role check: block non-admins
  if (!payload || payload.role !== 'admin') {
    document.body.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2>🚫 Access Denied</h2>
        <p>You must be an admin to view this page.</p>
        <a href="/members.html">Return to Member Dashboard</a>
      </div>
    `;
    return;
  }

  console.log('🛡️ Admin access confirmed');

  // Set avatar image
  const avatarImg = document.getElementById('member-avatar');
  if (avatarImg && payload.avatarUrl) {
    avatarImg.src = payload.avatarUrl;
  }

  // Dropdown toggle logic (navbar + admin sections)
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const targetId = toggle.getAttribute('data-target');
    const content = document.getElementById(targetId);
    if (!content) return;

    const isHidden = content.classList.toggle('hidden');
    const caret = toggle.querySelector('#avatar-caret');
    if (caret) {
      caret.textContent = isHidden ? '▸' : '▾';
    }
  });
});

  // Smooth scroll for navbar dropdown links
  document.querySelectorAll('#member-menu a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').split('#')[1];
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Logout from dropdown
  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/';
  });

  // Hide Promote to Admin if not gfhadmin
  if (payload.username !== 'gfhadmin') {
    document.getElementById('promote-admin-section')?.classList.add('hidden');
  }

  // Logout handler
  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  });

  // Populate user dropdown for promotion
  const userSelect = document.getElementById('user-dropdown');
  if (userSelect) {
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(users => {
        const list = Array.isArray(users) ? users : users.users;
        if (!Array.isArray(list)) throw new Error('Invalid user list');
        list.forEach(user => {
          const option = document.createElement('option');
          option.value = user.email;
          option.textContent = `${user.firstName} (${user.email})`;
          userSelect.appendChild(option);
        });
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        const fallback = document.createElement('option');
        fallback.textContent = 'Unable to load users';
        userSelect.appendChild(fallback);
      });
  }

  // Promote to Admin handler
  document.getElementById('promote-button')?.addEventListener('click', async () => {
    const selectedEmail = document.getElementById('user-dropdown')?.value;
    if (!selectedEmail) {
      alert('Please select a user to promote.');
      return;
    }

    try {
      const res = await fetch('/api/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: selectedEmail })
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.message || 'User promoted successfully!');
      } else {
        alert(result.error || 'Failed to promote user.');
      }
    } catch (err) {
      console.error('Promotion error:', err);
      alert('Server error. Please try again later.');
    }
  });

// --- Lesson Form Submission ---
const form = document.getElementById('lesson-form');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const lessonId = form.getAttribute('data-edit-id'); // check if editing
  const method = lessonId ? 'PUT' : 'POST';
  const url = lessonId ? `/api/lessons/${lessonId}` : '/api/lessons';

  const lessonData = {
    title: document.getElementById('title').value.trim(),
    content: document.getElementById('content').value.trim(),
    difficulty: document.getElementById('difficulty').value.trim(),
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()),
    estimatedTime: document.getElementById('estimatedTime').value.trim(),
    videoUrl: document.getElementById('videoUrl').value.trim(),
    quiz: Array.from(document.querySelectorAll('.quiz-question')).map(q => ({
      question: q.querySelector('.quiz-question-text').value,
      options: q.querySelector('.quiz-options').value.split(',').map(o => o.trim()),
      correctAnswer: parseInt(q.querySelector('.quiz-correct').value, 10),
      explanation: q.querySelector('.quiz-explanation').value
    }))
  };

  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(lessonData)
  });

  const data = await res.json();
  console.log(`📥 Lesson ${method} response:`, data);

  form.removeAttribute('data-edit-id'); // reset after save
  await loadLessonPreview();
});

// --- Quiz Question Adder ---
document.getElementById('add-question')?.addEventListener('click', () => {
  const container = document.createElement('div');
  container.classList.add('quiz-question');
  container.innerHTML = `
    <label>Question:</label>
    <input type="text" class="quiz-question-text" required />
    <label>Options (comma separated):</label>
    <input type="text" class="quiz-options" required />
    <label>Correct Answer Index (0-based):</label>
    <input type="number" class="quiz-correct" min="0" required />
    <label>Explanation (optional):</label>
    <input type="text" class="quiz-explanation" />
  `;
  document.getElementById('quiz-questions').appendChild(container);
});

// --- Analytics Progress ---
async function loadAnalyticsProgress() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/progress/lesson-1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const progress = result?.data?.progress ?? 0;
    document.getElementById('analytics-label').textContent = `${progress}% Complete`;
    document.getElementById('analytics-bar').style.width = `${progress}%`;
  } catch (err) {
    console.error('Analytics load error:', err);
    document.getElementById('analytics-label').textContent = 'Unable to load data';
  }
}

// --- User Management ---
async function loadUserTable() {
  const token = localStorage.getItem('token');
  const tbody = document.querySelector('#user-table tbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    const users = Array.isArray(result) ? result : result.users;

    tbody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.firstName}</td>
        <td>${user.email}</td>
        <td><span class="role-badge">${user.role}</span></td>
        <td><button class="action-button">Manage</button></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('User table load error:', err);
    tbody.innerHTML = '<tr><td colspan="4">Unable to load users</td></tr>';
  }
}

// --- Lesson Preview ---
async function loadLessonPreview() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/lessons', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lessons = await res.json();

    const previewBody = document.getElementById('lesson-preview');
    if (!previewBody) return;

    previewBody.innerHTML = '';
    lessons.forEach(lesson => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${lesson.title}</td>
        <td>${lesson.difficulty}</td>
        <td>${lesson.tags?.join(', ') || ''}</td>
        <td>${lesson.estimatedTime || ''}</td>
        <td>
          <button onclick="editLesson('${lesson._id}')">✏️ Edit</button>
          <button onclick="deleteLesson('${lesson._id}')">🗑️ Delete</button>
        </td>
      `;
      previewBody.appendChild(row);
    });
  } catch (err) {
    console.warn('⚠️ Lesson preview fetch failed:', err);
  }
}

// --- Lesson Delete ---
async function deleteLesson(id) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to delete this lesson?')) return;

  try {
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('🗑️ Lesson deleted:', data);
    await loadLessonPreview();
  } catch (err) {
    console.error('Error deleting lesson:', err);
  }
}

// --- Lesson Edit ---
async function editLesson(id) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/lessons/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lesson = await res.json();

    // Populate form fields
    document.getElementById('title').value = lesson.title;
    document.getElementById('content').value = lesson.content;
    document.getElementById('difficulty').value = lesson.difficulty;
    document.getElementById('tags').value = lesson.tags?.join(', ') || '';
    document.getElementById('estimatedTime').value = lesson.estimatedTime || '';
    document.getElementById('videoUrl').value = lesson.videoUrl || '';

    // Store current lesson ID for update
    form.setAttribute('data-edit-id', id);
  } catch (err) {
    console.error('Error loading lesson for edit:', err);
  }
}

window.deleteLesson = deleteLesson;
window.editLesson = editLesson;

// ✅ Run initial loads on page ready
loadLessonPreview();
loadAnalyticsProgress();
loadUserTable();
}); 