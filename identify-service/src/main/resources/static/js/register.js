(() => {
  const { API_BASE, request, setMessage, busy } = window.Identify;
  const form = document.getElementById('register-form');
  const submit = document.getElementById('register-submit');
  const message = document.getElementById('register-message');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.getElementById('register-password').value;
    if (password !== document.getElementById('register-password-confirm').value) {
      setMessage(message, 'Mật khẩu nhập lại chưa khớp.', 'error');
      return;
    }

    const username = document.getElementById('register-username').value.trim();
    const payload = {
      username,
      password,
      firstName: document.getElementById('first-name').value.trim(),
      lastName: document.getElementById('last-name').value.trim()
    };
    const dob = document.getElementById('dob').value;
    if (dob) payload.dob = dob;

    busy(submit, true, 'Đang tạo tài khoản…');
    setMessage(message, '');
    try {
      await request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      sessionStorage.setItem('identify.pendingUsername', username);
      window.location.replace(`${API_BASE}/index.html?registered=1`);
    } catch (error) {
      setMessage(message, error.message, 'error');
    } finally {
      busy(submit, false, 'Tạo tài khoản');
    }
  });
})();
