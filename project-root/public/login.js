const rememberFlag = localStorage.getItem('rememberMeChecked');
const remembered = JSON.parse(localStorage.getItem('rememberedLogin') || 'null');

if (rememberFlag === 'true' && remembered) {
  document.getElementById('user').value = remembered.username || '';
  document.getElementById('pass').value = remembered.password || '';
  document.getElementById('remember').checked = true;
} else {
  // Ensure fields start empty if not remembered
  document.getElementById('user').value = '';
  document.getElementById('pass').value = '';
  document.getElementById('remember').checked = false;
  // 🔑 Explicitly clear any leftover remembered login
  localStorage.removeItem('rememberedLogin');
  localStorage.removeItem('rememberMeChecked');
}

// ---- Login form submit handler ----
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('user').value.trim();
  const password = document.getElementById('pass').value.trim();
  const rememberMe = document.getElementById('remember').checked;
  const feedback = document.getElementById('error-message');

  if (!username || !password) {
    showError('Please enter both username and password.');
    return;
  }

  const storedUser = localStorage.getItem('subscribedUser');
  console.log('📤 Sending login request with x-user-info:', storedUser);

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-info': storedUser || '{}'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // Save token
      localStorage.setItem('token', data.token);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMeChecked', 'true');
        localStorage.setItem('rememberedLogin', JSON.stringify({ username, password }));
      } else {
        // 🔑 Clear everything if not remembered
        localStorage.removeItem('rememberMeChecked');
        localStorage.removeItem('rememberedLogin');
      }

      // Redirect to members dashboard
      window.location.href = '/members.html';
    } else {
      if (feedback) {
        feedback.textContent = data.message || 'Login failed.';
        feedback.className = 'subscribe-feedback error';
      }
    }
  } catch (err) {
    showError('Server error. Please try again later.');
  }
});

// ---- Error display helper ----
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
  } else {
    console.error('Login error:', message);
  }
}