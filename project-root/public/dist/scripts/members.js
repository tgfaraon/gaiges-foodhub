document.addEventListener('DOMContentLoaded', async () => {
  console.log('members.js loaded, DOMContentLoaded fired');

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Decode token and personalize dashboard
  let payload;
  try {
    payload = JSON.parse(atob(token.split('.')[1]));
    const firstName = payload.firstName || 'Member';

    // Personalize UI
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${firstName}!`;

    const firstNameInput = document.getElementById('account-firstname');
    if (firstNameInput) firstNameInput.value = firstName;

    const emailInput = document.getElementById('account-email');
    if (emailInput) emailInput.value = payload.email || '';

    if (payload.role === 'admin') {
      document.body.classList.add('admin-mode');
      console.log('🛡️ Admin access granted');
    } else {
      console.log('👤 Member access only');
    }

    const greeting = document.getElementById('member-greeting');
    if (greeting) {
      const hour = new Date().getHours();
      let timeGreeting = 'Hello';
      if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
      else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
      else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';
      else timeGreeting = 'Burning the midnight oil';
      greeting.textContent = `${timeGreeting}, ${firstName}!`;
    }

    const avatarImg = document.getElementById('member-avatar');
    if (avatarImg && payload.avatarUrl) {
      avatarImg.src = payload.avatarUrl;
    }
  } catch (err) {
    console.error('Token decode error:', err);
    document.body.innerHTML = '<h2>Invalid token</h2>';
    return;
  }

  // Admin button toggle
  const adminButton = document.getElementById('admin-dashboard-link');
  if (adminButton) {
    if (payload.role === 'admin') {
      adminButton.classList.remove('hidden');
      console.log('🛡️ Admin button visible');
    } else {
      adminButton.classList.add('hidden');
      console.log('👤 Admin button hidden for non-admin');
    }
  }

  // Render a single lesson block based on status
  function renderLessonBlock(lessonId, title, status) {
    const section = document.getElementById('lesson-section');
    if (!section) return;

    const block = document.createElement('div');
    block.classList.add('lesson-block', status);

    if (status === 'active') {
      block.innerHTML = `
        <h3>${title}</h3>
        <button onclick="startLesson('${lessonId}')">Start Lesson</button>
        <button onclick="completeLesson('${lessonId}')">Mark Complete</button>
      `;
    } else if (status === 'completed') {
      block.innerHTML = `<h3>${title}</h3><p>✅ Completed</p>`;
    } else {
      block.innerHTML = `<h3>${title}</h3><p>🔒 Locked</p>`;
    }

    section.appendChild(block);
  }

  // Load all lessons and render blocks (index-based with numeric progress)
  async function loadLessons() {
    console.log('loadLessons called');
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch('/api/lessons', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/progress', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!lessonsRes.ok || !progressRes.ok) throw new Error('Failed to fetch lessons/progress');

      const lessons = await lessonsRes.json();
      const progress = await progressRes.json();
      const completed = progress.completedLessons || [];
      const currentLesson = Math.max(1, progress.currentLesson || 1);

      console.log('Lessons returned:', lessons.map((l, i) => ({ number: i+1, id: l._id, title: l.title })));
      console.log('Progress returned:', progress);

      const section = document.getElementById('lesson-section');
      if (section) section.innerHTML = '';

      lessons.forEach((lesson, idx) => {
        const lessonNumber = idx + 1;
        let status = 'locked';

        if (completed.includes(lessonNumber)) {
          status = 'completed';
        } else if (lessonNumber === currentLesson) {
          status = 'active';
        }

        renderLessonBlock(lesson._id, lesson.title, status);
      });
    } catch (err) {
      console.error('Error loading lessons:', err);
      const section = document.getElementById('lesson-section');
      if (section) section.innerHTML = '<p>Unable to load lessons.</p>';
    }
  }

  // Load member lessons (cards view)
  async function loadMemberLessons() {
    console.log('loadMemberLessons called');
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch('/api/lessons', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/progress', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!lessonsRes.ok || !progressRes.ok) throw new Error('Failed to fetch data');

      const lessons = await lessonsRes.json();
      const progress = await progressRes.json();
      const currentLessonIndex = Math.max(0, (progress.currentLesson || 1) - 1);

      console.log('Lessons returned:', lessons.map((l, i) => ({ number: i+1, id: l._id, title: l.title })));
      console.log('Progress returned:', progress);

      const container = document.getElementById('member-lessons');
      if (!container) return;
      container.innerHTML = '';

      lessons.forEach((lesson, idx) => {
        const card = document.createElement('div');
        card.classList.add('lesson-card');

        if (idx === currentLessonIndex) {
          card.classList.add('active');
          card.innerHTML = `
            <h3>${lesson.title}</h3>
            <p>Difficulty: ${lesson.difficulty}</p>
            <p>Estimated Time: ${lesson.estimatedTime}</p>
            <button onclick="startLesson('${lesson._id}')">Start Lesson</button>
            <button onclick="completeLesson('${lesson._id}')">Mark Complete</button>
          `;
        } else if (idx < currentLessonIndex) {
          card.classList.add('completed');
          card.innerHTML = `<h3>${lesson.title}</h3><p>✅ Completed</p>`;
        } else {
          card.classList.add('locked');
          card.innerHTML = `<h3>${lesson.title}</h3><p>🔒 Locked</p>`;
        }

        container.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading member lessons:', err);
      const container = document.getElementById('member-lessons');
      if (container) container.innerHTML = '<p>Unable to load lessons</p>';
    }
  }

  // Load lesson progress (after lessons render)
  async function loadLessonProgress() {
    console.log('loadLessonProgress called');
    try {
      const res = await fetch('/api/progress', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const totalLessons = document.querySelectorAll('.lesson-block').length;
      const completedCount = data.completedLessons?.length || 0;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      animateProgressBar(progressPercent);
      checkMilestoneBadges(progressPercent);
    } catch (err) {
      console.error('Error loading overall progress:', err);
    }
  }

  function animateProgressBar(targetProgress) {
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    if (!bar || !label) return;

    let current = 0;
    const interval = setInterval(() => {
      if (current >= targetProgress) {
        clearInterval(interval);
      } else {
        current += 1;
        bar.style.width = `${current}%`;
        label.textContent = `${current}% Complete`;
      }
    }, 15);
  }

  function checkMilestoneBadges(progress) {
    const badgeContainer = document.getElementById('badge-container');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = '';
    const badges = [
      { threshold: 0, label: 'Joined Gaige\'s Food Hub', icon: '🥬' },
      { threshold: 30, label: 'First Lesson Complete', icon: '🍳' },
      { threshold: 60, label: 'Halfway Through!', icon: '🥘' },
      { threshold: 100, label: 'Master Chef!', icon: '🎉' }
    ];
    badges.forEach(badge => {
      if (progress >= badge.threshold) {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'badge';
        badgeEl.innerHTML = `<span class="badge-icon">${badge.icon}</span> ${badge.label}`;
        badgeContainer.appendChild(badgeEl);
      }
    });
  }

  // Badge modal toggles
  const viewBadgesBtn = document.getElementById('view-all-badges');
  if (viewBadgesBtn) {
    viewBadgesBtn.addEventListener('click', () => {
      const modal = document.getElementById('badge-modal');
      if (modal) modal.classList.remove('hidden');
    });
  }
  const closeBadgesBtn = document.getElementById('close-badge-modal');
  if (closeBadgesBtn) {
    closeBadgesBtn.addEventListener('click', () => {
      const modal = document.getElementById('badge-modal');
      if (modal) modal.classList.add('hidden');
    });
  }

  // Update account info
  const updateBtn = document.getElementById('update-account');
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      const updatedInfo = {
        firstName: document.getElementById('account-firstname')?.value || '',
        email: document.getElementById('account-email')?.value || ''
      };
      try {
        const res = await fetch('/api/user/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedInfo)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        alert('✅ Account updated!');
      } catch (err) {
        console.error('Account update failed:', err);
        alert('Failed to update account.');
      }
    });
  }

  // Saved content
  async function loadSavedContent() {
    console.log('loadSavedContent called');
    try {
      const response = await fetch('/api/user/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const list = document.getElementById('saved-list');
      if (!list) return;
      list.innerHTML = '';

      if (!result.items || result.items.length === 0) {
        list.innerHTML = '<p>No saved recipes or lessons yet.</p>';
        return;
      }

      window.savedItems = result.items;
      renderSavedItems('all');
    } catch (err) {
      console.error('Failed to load saved content:', err);
    }
  }

  function renderSavedItems(filterType) {
    const list = document.getElementById('saved-list');
    if (!list || !window.savedItems) return;
    list.innerHTML = '';

    const filtered = window.savedItems.filter(item =>
      filterType === 'all' ? true : item.type === filterType
    );

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'saved-card';
      card.setAttribute('data-type', item.type);

      const img = document.createElement('img');
      img.src = item.thumbnail || '/images/placeholder.jpg';
      img.alt = item.title;

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = item.title;

      card.appendChild(img);
      card.appendChild(title);

      card.addEventListener('click', () => {
        window.location.href = item.link || `/view/${item.id}`;
      });

      list.appendChild(card);
    });
  }

  // Filter buttons for saved content
  document.querySelectorAll('.filter-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-filter');
      renderSavedItems(type);
    });
  });

  // Dropdown toggles
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      const content = document.getElementById(targetId);
      if (!content) return;
      const isHidden = content.classList.toggle('hidden');
      const caret = toggle.querySelector('span[id$="caret"], #avatar-caret');
      if (caret) caret.textContent = isHidden ? '▸' : '▾';
    });
  });

  // Smooth scroll for navbar dropdown links
  document.querySelectorAll('#member-menu a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').split('#')[1];
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Logout
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('member-menu');
    const toggle = document.querySelector('.avatar-button');
    if (!dropdown || !toggle) return;
    const clickedInside = dropdown.contains(e.target) || toggle.contains(e.target);
    if (!clickedInside) dropdown.classList.add('hidden');
  });

  // Handlers exposed globally for inline onclick
  window.startLesson = function startLesson(lessonId) {
    window.location.href = `/lessons/lesson-viewer.html?id=${lessonId}`;
  };

  window.completeLesson = async function completeLesson(lessonId) {
    try {
      const res = await fetch(`/api/memberLessons/${lessonId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      alert(data.message);
      await loadLessons();
      await loadLessonProgress();
      await loadMemberLessons();
    } catch (err) {
      console.error('Error completing lesson:', err);
      alert('Failed to mark lesson complete.');
    }
  };

  // Initialization order: lessons -> progress -> member cards -> saved content
  await loadLessons();
  await loadLessonProgress();
  await loadMemberLessons();
  await loadSavedContent();
});