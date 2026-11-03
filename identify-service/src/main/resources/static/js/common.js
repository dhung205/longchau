(() => {
  // Strip the current static page (including cart.html/product.html) before
  // building API URLs. Otherwise a cart visit incorrectly calls
  // /identify/cart.html/users/myInfo.
  const pagePath = window.location.pathname.replace(/\/[^/]+\.html$/, '');
  const contextPath = pagePath.replace(/\/+$/, '');
  const API_BASE = `${window.location.origin}${contextPath}`;
  const TOKEN_KEY = 'identify.accessToken';

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    return body;
  }

  function authResult(body) {
    const result = body.result || body;
    if (!result.authenticated || !result.token) {
      throw new Error(body.message || 'Máy chủ không trả về token hợp lệ.');
    }
    return result;
  }

  function setMessage(element, text, kind = '') {
    element.textContent = text;
    element.className = `message ${kind}`.trim();
  }

  function busy(button, state, label) {
    button.disabled = state;
    button.innerHTML = state ? `<span class="spinner" aria-hidden="true"></span>${label}` : label;
  }

  window.Identify = {
    API_BASE,
    TOKEN_KEY,
    request,
    authResult,
    setMessage,
    busy,
    saveToken(token) { sessionStorage.setItem(TOKEN_KEY, token); },
    getToken() { return sessionStorage.getItem(TOKEN_KEY); },
    clearToken() { sessionStorage.removeItem(TOKEN_KEY); },
    goHome() { window.location.replace(`${API_BASE}/home.html`); },
    goLogin() { window.location.replace(`${API_BASE}/index.html`); },
    decodeToken(token) {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = part.padEnd(Math.ceil(part.length / 4) * 4, '=');
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), value => value.charCodeAt(0))));
    }
  };
})();
