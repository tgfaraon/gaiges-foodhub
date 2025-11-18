document.addEventListener('DOMContentLoaded', () => {
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

    document.getElementById('welcome-message').textContent = `Welcome, ${firstName}!`;
    document.getElementById('account-firstname').value = firstName;
    document.getElementById('account-email').value = payload.email || '';

    // 🔐 Role-based access check
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

      if (hour >= 5 && hour < 12) {
        timeGreeting = 'Good morning';
      } else if (hour >= 12 && hour < 17) {
        timeGreeting = 'Good afternoon';
      } else if (hour >= 17 && hour < 22) {
        timeGreeting = 'Good evening';
      } else {
        timeGreeting = 'Burning the midnight oil';
      }

      greeting.textContent = `${timeGreeting}, ${firstName}!`;
    }

    // Set avatar in navbar dropdown
    const avatarImg = document.getElementById('member-avatar');
    if (avatarImg && payload.avatarUrl) {
      avatarImg.src = payload.avatarUrl;
    }
  } catch (err) {
    console.error('Token decode error:', err);
    document.body.innerHTML = '<h2>Invalid token</h2>';
    return;
  } 

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

  async function renderLessonBlock(lessonId, title) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/progress/lesson/${lessonId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();

  const block = document.createElement('div');
  block.classList.add('lesson-block');

  const button = document.createElement('button');
  if (data.progress > 0) {
    button.textContent = 'Continue Lesson';
    button.onclick = () => window.location.href = `/lessons/lesson-viewer.html?id=${lessonId}`;
  } else {
    button.textContent = 'Start Lesson';
    button.onclick = () => window.location.href = `/lessons/lesson-viewer.html?id=${lessonId}`;
  }

  block.innerHTML = `<h3>${title}</h3>`;
  block.appendChild(button);

  document.getElementById('lesson-section').appendChild(block);
}

  // Load all lessons and render blocks
  async function loadLessons() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/lessons', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lessons = await res.json();

    const section = document.getElementById('lesson-section');
    section.innerHTML = ''; // clear old blocks

    lessons.forEach(lesson => {
      renderLessonBlock(lesson._id, lesson.title);
    });
  } catch (err) {
    console.error('Error loading lessons:', err);
    document.getElementById('lesson-section').innerHTML =
      '<p>Unable to load lessons.</p>';
  }
}

  // Load lesson progress
  async function loadLessonProgress() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/progress/overall', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    animateProgressBar(data.progress || 0);
    checkMilestoneBadges(data.progress || 0);
  } catch (err) {
    console.error('Error loading overall progress:', err);
  }
}

  // Animate progress bar
  function animateProgressBar(targetProgress) {
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
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

  badgeContainer.innerHTML = ''; // Clear existing badges

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

  document.getElementById('view-all-badges')?.addEventListener('click', () => {
  document.getElementById('badge-modal')?.classList.remove('hidden');
});

document.getElementById('close-badge-modal')?.addEventListener('click', () => {
  document.getElementById('badge-modal')?.classList.add('hidden');
});

  // Update account info
  document.getElementById('update-account')?.addEventListener('click', async () => {
    const updatedInfo = {
      firstName: document.getElementById('account-firstname').value,
      email: document.getElementById('account-email').value
    };

    await fetch('/api/user/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedInfo)
    });

    alert('✅ Account updated!');
  });

  // Load saved content
  async function loadSavedContent() {
    try {
      const response = await fetch('/api/user/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      const list = document.getElementById('saved-list');
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

  // Filter buttons
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

    // Update caret if present
    const caret = toggle.querySelector('span[id$="caret"], #avatar-caret');
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

  document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('member-menu');
  const toggle = document.querySelector('.avatar-button');

  if (!dropdown || !toggle) return;

  const clickedInside = dropdown.contains(e.target) || toggle.contains(e.target);
  if (!clickedInside) {
    dropdown.classList.add('hidden');
  }
});

  // Initial load
  loadLessons();
  loadLessonProgress();
  loadSavedContent();
}); 