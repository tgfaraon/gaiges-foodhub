document.addEventListener('DOMContentLoaded', function () {
  // --- Auth guard ---
  var token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // --- JWT decode + role check ---
  var payload;
  try {
    var base64 = token.split('.')[1];
    payload = JSON.parse(atob(base64));
  } catch (err) {
    console.error('Invalid token:', err);
    window.location.href = '/login.html';
    return;
  }

  if (!payload || payload.role !== 'admin') {
    document.body.innerHTML =
      '<div style="text-align: center; margin-top: 100px;">' +
      '<h2>Access Denied</h2>' +
      '<p>You must be an admin to view this page.</p>' +
      '<a href="/members.html">Return to Member Dashboard</a>' +
      '</div>';
    return;
  }

  console.log('Admin access confirmed');

  // --- Avatar ---
  var avatarImg = document.getElementById('member-avatar');
  if (avatarImg && payload.avatarUrl) {
    avatarImg.src = payload.avatarUrl;
  }

  // --- Dropdown toggle logic ---
  var toggles = document.querySelectorAll('.dropdown-toggle');
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener('click', function () {
      var targetId = this.getAttribute('data-target');
      if (!targetId) return;
      var content = document.getElementById(targetId);
      if (!content) return;

      var isHidden = content.classList.toggle('hidden');
      var caret = this.querySelector('#avatar-caret');
      if (caret) {
        caret.textContent = isHidden ? '▸' : '▾';
      }
    });
  }

  // --- Smooth scroll for navbar dropdown links ---
  var menuLinks = document.querySelectorAll('#member-menu a[href^="#"]');
  for (var j = 0; j < menuLinks.length; j++) {
    menuLinks[j].addEventListener('click', function (e) {
      e.preventDefault();
      var href = this.getAttribute('href') || '';
      var targetId = href.indexOf('#') >= 0 ? href.split('#')[1] : '';
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- Logout handler ---
  var logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = '/login.html'; // adjust if you prefer '/'
    });
  }

  // --- Hide promote section unless gfhadmin ---
  if (payload.username !== 'gfhadmin') {
    var promoteSection = document.getElementById('promote-admin-section');
    if (promoteSection) promoteSection.classList.add('hidden');
  }

  // --- Populate user dropdown for promotion ---
  var userSelect = document.getElementById('user-dropdown');
  if (userSelect) {
    fetch('/api/users', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function (res) { return res.json(); })
      .then(function (users) {
        var list = Array.isArray(users) ? users : users.users;
        if (!Array.isArray(list)) throw new Error('Invalid user list');
        userSelect.innerHTML = '';
        list.forEach(function (user) {
          var option = document.createElement('option');
          option.value = user.email || '';
          option.textContent = (user.firstName || '') + ' (' + (user.email || '') + ')';
          userSelect.appendChild(option);
        });
      })
      .catch(function (err) {
        console.error('Failed to load users:', err);
        var fallback = document.createElement('option');
        fallback.textContent = 'Unable to load users';
        userSelect.appendChild(fallback);
      });
  }

  // --- Promote to Admin handler ---
  var promoteButton = document.getElementById('promote-button');
  if (promoteButton) {
    promoteButton.addEventListener('click', function () {
      var selectedEmailEl = document.getElementById('user-dropdown');
      var selectedEmail = selectedEmailEl ? selectedEmailEl.value : '';
      if (!selectedEmail) {
        alert('Please select a user to promote.');
        return;
      }

      fetch('/api/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ email: selectedEmail })
      })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
        .then(function (result) {
          if (result.ok) {
            alert(result.json.message || 'User promoted successfully!');
            loadUserTable();
          } else {
            alert(result.json.error || ('Failed to promote user. HTTP ' + result.status));
          }
        })
        .catch(function (err) {
          console.error('Promotion error:', err);
          alert('Server error. Please try again later.');
        });
    });
  }

  function loadProgress() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('analytics-label').textContent = 'Unauthorized';
    return;
  }

  fetch('/api/memberLessons', {
    headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json().then(json => ({ ok: res.ok, json, status: res.status })))
      .then(result => {
        if (!result.ok) throw new Error(result.json?.error || 'HTTP ' + result.status);

        const progress = result.json;
        const bar = document.getElementById('analytics-bar');
        const label = document.getElementById('analytics-label');

        bar.style.width = progress.completionPercentage + '%';
        label.textContent = progress.completionPercentage + '% complete';
      })
      .catch(err => {
        console.error('Error loading progress:', err);
        document.getElementById('analytics-label').textContent = 'Error loading progress';
      });
  }

// Call on page load
document.addEventListener('DOMContentLoaded', loadProgress);

  // --- Analytics Progress ---
  function loadAnalyticsProgress() {
    fetch('/api/analytics/progress', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error('HTTP ' + result.status);
        var progress = (result.json && result.json.data && typeof result.json.data.progress === 'number')
          ? result.json.data.progress
          : 0;
        var labelEl = document.getElementById('analytics-label');
        var barEl = document.getElementById('analytics-bar');
        if (labelEl) labelEl.textContent = progress + '% Complete';
        if (barEl) barEl.style.width = progress + '%';
      })
      .catch(function (err) {
        console.error('Analytics load error:', err);
        var labelEl = document.getElementById('analytics-label');
        if (labelEl) labelEl.textContent = 'Unable to load data';
      });
  }

  // --- User Management ---
  function loadUserTable() {
    var tbody = document.querySelector('#user-table tbody');
    if (!tbody) return;

    fetch('/api/users', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error('HTTP ' + result.status);
        var users = Array.isArray(result.json) ? result.json : result.json.users;

        tbody.innerHTML = '';
        (users || []).forEach(function (user) {
          var row = document.createElement('tr');
          row.innerHTML =
            '<td>' + (user.firstName || '') + '</td>' +
            '<td>' + (user.email || '') + '</td>' +
            '<td><span class="role-badge">' + (user.role || '') + '</span></td>' +
            '<td>' +
              (user.role === 'member'
                ? '<button class="action-button promote-btn" data-email="' + (user.email || '') + '">Promote</button>'
                : (user.username !== 'gfhadmin'
                    ? '<button class="action-button demote-btn" data-email="' + (user.email || '') + '">Demote</button>'
                    : '<span class="role-badge">Admin</span>')) +
              (user.username !== 'gfhadmin'
                ? ' <button class="action-button delete-btn" data-id="' + (user._id || '') + '">Delete</button>'
                : '') +
            '</td>';
          tbody.appendChild(row);
        });

        // Attach event listeners
        var promoteBtns = document.querySelectorAll('.promote-btn');
        for (var p = 0; p < promoteBtns.length; p++) {
          promoteBtns[p].addEventListener('click', function () {
            var email = this.getAttribute('data-email');
            fetch('/api/users/promote', {
              method: 'POST',
              headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: email })
            })
              .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
              .then(function (result) {
                if (!result.ok) throw new Error(result.json && result.json.error ? result.json.error : ('HTTP ' + result.status));
                alert(result.json.message || 'User promoted successfully!');
                loadUserTable();
              })
              .catch(function (err) {
                console.error('Promotion failed:', err);
                alert('Failed to promote user.');
              });
          });
        }

        var demoteBtns = document.querySelectorAll('.demote-btn');
        for (var d = 0; d < demoteBtns.length; d++) {
          demoteBtns[d].addEventListener('click', function () {
            var email = this.getAttribute('data-email');
            fetch('/api/users/demote', {
              method: 'POST',
              headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: email })
            })
              .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
              .then(function (result) {
                if (!result.ok) throw new Error(result.json && result.json.error ? result.json.error : ('HTTP ' + result.status));
                alert(result.json.message || 'User demoted successfully!');
                loadUserTable();
              })
              .catch(function (err) {
                console.error('Demotion failed:', err);
                alert('Failed to demote user.');
              });
          });
        }

        var deleteBtns = document.querySelectorAll('.delete-btn');
        for (var x = 0; x < deleteBtns.length; x++) {
          deleteBtns[x].addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Are you sure you want to delete this account?')) return;

            fetch('/api/users/' + id, {
              method: 'DELETE',
              headers: { Authorization: 'Bearer ' + token }
            })
              .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
              .then(function (result) {
                if (!result.ok) throw new Error(result.json && result.json.error ? result.json.error : ('HTTP ' + result.status));
                alert(result.json.message || 'User deleted successfully!');
                loadUserTable();
              })
              .catch(function (err) {
                console.error('Deletion failed:', err);
                alert('Failed to delete user.');
              });
          });
        }
      })
      .catch(function (err) {
        console.error('User table load error:', err);
        tbody.innerHTML = '<tr><td colspan="4">Unable to load users</td></tr>';
      });
  }

  // Lesson Edit (publish to React editor) 
function editLesson(id) {
  fetch('/api/lessons/' + id, {
    headers: { Authorization: 'Bearer ' + token }
  })
    .then(res => res.json().then(json => ({ ok: res.ok, json, status: res.status })))
    .then(result => {
      if (!result.ok) throw new Error(result.json?.error || 'HTTP ' + result.status);
      const lesson = result.json;

      // 👉 Dispatch event so React LessonEditor can consume it
      const event = new CustomEvent('admin:edit-lesson', { detail: { lesson } });
      window.dispatchEvent(event);

      // Ensure the editor section is visible and scrolled into view
      const editorSection = document.getElementById('lesson-editor-panel');
      if (editorSection) {
        editorSection.classList.remove('hidden');
        editorSection.scrollIntoView({ behavior: 'smooth' });
      }
    })
    .catch(err => {
      console.error('Error loading lesson for edit:', err);
      alert('Failed to load lesson for editing.');
    });
}

  // --- Lesson Preview ---
  function loadLessonPreview() {
    fetch('/api/lessons', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error('HTTP ' + result.status);
        var lessons = result.json;

        var previewBody = document.getElementById('lesson-preview');
        if (!previewBody) return;

        previewBody.innerHTML = '';
        (lessons || []).forEach(function (lesson) {
          var row = document.createElement('tr');
          row.innerHTML =
            '<td>' + (lesson.title || '') + '</td>' +
            '<td>' + (lesson.difficulty || '') + '</td>' +
            '<td>' + (Array.isArray(lesson.tags) ? lesson.tags.join(', ') : (lesson.tags || '')) + '</td>' +
            '<td>' + (lesson.estimatedTime || '') + '</td>' +
            '<td>' +
              '<button class="edit-lesson-btn" data-id="' + (lesson._id || '') + '">Edit</button> ' +
              '<button class="delete-lesson-btn" data-id="' + (lesson._id || '') + '">Delete</button>' +
            '</td>';
          previewBody.appendChild(row);
        });

        var delBtns = document.querySelectorAll('.delete-lesson-btn');
        for (var k = 0; k < delBtns.length; k++) {
          delBtns[k].addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (id) deleteLesson(id);
          });
        }
        var editBtns = document.querySelectorAll('.edit-lesson-btn');
        for (var m = 0; m < editBtns.length; m++) {
          editBtns[m].addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (id) editLesson(id);
          });
        }
      })
      .catch(function (err) {
        console.warn('Lesson preview fetch failed:', err);
        var previewBody = document.getElementById('lesson-preview');
        if (previewBody) {
          previewBody.innerHTML = '<tr><td colspan="5">Unable to load lessons</td></tr>';
        }
      });
  }

  // --- Lesson Delete ---
  function deleteLesson(id) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    fetch('/api/lessons/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json, status: res.status }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error(result.json && result.json.error ? result.json.error : ('HTTP ' + result.status));
        console.log('Lesson deleted:', result.json);
        loadLessonPreview();
      })
      .catch(function (err) {
        console.error('Error deleting lesson:', err);
        alert('Failed to delete lesson.');
      });
  }

  // --- Expose preview actions globally if needed ---
  window.loadLessonPreview = loadLessonPreview;

  // --- Initial loads ---
  loadAnalyticsProgress();
  loadUserTable();
  loadLessonPreview();
}); 