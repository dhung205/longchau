(() => {
  const { API_BASE, request, authResult, setMessage, busy, saveToken, goHome } = window.Identify;
  const form = document.getElementById('login-form');
  const submit = document.getElementById('login-submit');
  const googleButton = document.getElementById('google-login');
  const message = document.getElementById('login-message');

  async function finishLogin(authResponse) {
    const { token } = authResult(authResponse);
    saveToken(token);
    try {
      const body = await request('/users/myInfo', {headers: {Authorization: `Bearer ${token}`}});
      const roles = (body.result?.roles || []).map(role => role.name);
      const page = roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : 'home.html';
      window.location.replace(`${API_BASE}/${page}`);
    } catch (error) {
      window.Identify.clearToken();
      throw error;
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    busy(submit, true, 'Đang đăng nhập…');
    setMessage(message, '');
    try {
      await finishLogin(await request('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value
        })
      }));
    } catch (error) {
      setMessage(message, error.message, 'error');
    } finally {
      busy(submit, false, 'Đăng nhập');
    }
  });

  googleButton.addEventListener('click', () => {
    window.location.assign(`${API_BASE}/oauth2/authorization/google`);
  });

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (code || error) window.history.replaceState({}, document.title, window.location.pathname);

  if (code) {
    googleButton.disabled = true;
    setMessage(message, 'Đang hoàn tất đăng nhập Google…');
    request('/auth/oauth2/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    }).then(finishLogin).catch(err => setMessage(message, err.message, 'error'))
      .finally(() => { googleButton.disabled = false; });
  } else if (error) {
    setMessage(message, 'Google chưa thể xác thực tài khoản. Vui lòng thử lại.', 'error');
  } else if (new URLSearchParams(window.location.search).has('registered')) {
    const username = sessionStorage.getItem('identify.pendingUsername');
    if (username) document.getElementById('username').value = username;
    sessionStorage.removeItem('identify.pendingUsername');
    setMessage(message, 'Đăng ký thành công. Hãy đăng nhập để tiếp tục.', 'success');
  }
})();
