document.addEventListener('DOMContentLoaded', () => {
  ['first-name', 'last-name', 'username', 'email', 'password', 'confirm-password'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.removeAttribute('readonly');
  });
});

document.getElementById('subscribe-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('first-name')?.value.trim();
  const lastName = document.getElementById('last-name')?.value.trim();
  const username = document.getElementById('username')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const confirmPassword = document.getElementById('confirm-password')?.value.trim();

  const feedback = document.getElementById('feedback');
  const spinner = document.getElementById('loading-spinner');
  const submitBtn = document.getElementById('submit-btn');

  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.color = '#b00';
    errorDiv.className = 'error';
  }

  // Basic validation
  if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
    showError('Please fill out all fields.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Please enter a valid email.');
    return;
  }

  if (!hasNumber || !hasSpecialChar) {
    showError('Password must include at least one number and one special character.');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  spinner.style.display = 'block';
  console.log('📤 Sending signup request:', { firstName, lastName, username, email });

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, username, email, password, confirmPassword })
    });

    const data = await res.json();
    spinner.style.display = 'none';

    if (res.status === 409) {
      feedback.textContent = data.message;
      feedback.className = 'subscribe-feedback error';
      return;
    }

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('subscribedUser', JSON.stringify({ firstName, username }));

      feedback.textContent = data.message || '🎉 Subscribed successfully!';
      feedback.style.color = '#0a7a0a';
      feedback.className = 'success';

      submitBtn.textContent = 'Subscribed!';
      submitBtn.style.backgroundColor = '#0a7a0a';
      submitBtn.style.color = '#fff';

      setTimeout(() => {
        submitBtn.textContent = 'Subscribe';
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
      }, 3000);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      document.getElementById('subscribe-form').style.display = 'none';
      window.location.href = '/members.html';
    } else {
      showError(data.message || 'Subscription failed.');
    }
  } catch (err) {
    spinner.style.display = 'none';
    console.error('💥 Subscription error:', err);
    showError('Subscription failed. Please try again later.');
  }
});