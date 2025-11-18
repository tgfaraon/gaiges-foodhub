const rememberFlag = localStorage.getItem('rememberMeChecked');
const remembered = JSON.parse(localStorage.getItem('rememberedLogin'));

if (rememberFlag === 'true' && remembered) {
  document.getElementById('user').value = remembered.username || '';
  document.getElementById('pass').value = remembered.password || '';
  document.getElementById('remember').checked = true;
}

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
      localStorage.setItem('token', data.token);
      localStorage.setItem('rememberMeChecked', rememberMe ? 'true' : 'false');

      if (rememberMe) {
        localStorage.setItem('rememberedLogin', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('rememberedLogin');
      }

      window.location.href = '/members.html';
    } else {
      feedback.textContent = data.message || 'Login failed.';
      feedback.className = 'subscribe-feedback error';
    }
  } catch (err) {
    showError('Server error. Please try again later.');
  }
});

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
}