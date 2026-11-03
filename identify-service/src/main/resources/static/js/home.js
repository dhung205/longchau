(() => {
  const { API_BASE, request, getToken, clearToken, goLogin, decodeToken, setMessage } = window.Identify;
  const token = getToken();
  const homeMessage = document.getElementById('home-message');
  if (!token) {
    goLogin();
    return;
  }

  let claims = {};
  try { claims = decodeToken(token); } catch { /* Profile data will still be requested below. */ }
  document.getElementById('profile-username').textContent = claims.sub || '—';
  document.getElementById('profile-roles').textContent = claims.scope || '—';
  document.getElementById('profile-expiry').textContent = claims.exp
    ? new Date(claims.exp * 1000).toLocaleString('vi-VN') : '—';
  document.getElementById('home-greeting').textContent = `Xin chào, ${claims.sub || 'bạn'}`;

  request('/users/myInfo', { headers: { Authorization: `Bearer ${token}` } })
    .then(body => {
      const profile = body.result || {};
      const username = profile.username || claims.sub || 'bạn';
      document.getElementById('profile-username').textContent = username;
      document.getElementById('home-greeting').textContent = `Xin chào, ${username}`;
      document.getElementById('profile-name').textContent = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Chưa cập nhật';
      const roles = (profile.roles || []).map(role => role.name).filter(Boolean);
      document.getElementById('profile-roles').textContent = roles.join(', ') || claims.scope || 'Người dùng';
    })
    .catch(error => setMessage(homeMessage, `${error.message} Hãy đăng nhập lại để làm mới phiên.`, 'error'));

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('product-search');
  const productCards = [...document.querySelectorAll('.product-card')];
  const countLabel = document.getElementById('product-count');
  const emptyProducts = document.getElementById('empty-products');
  let selectedCategory = 'all';

  function filterProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase('vi');
    let visibleCount = 0;
    productCards.forEach(card => {
      const categoryMatches = selectedCategory === 'all' || card.dataset.category === selectedCategory;
      const queryMatches = !query || card.dataset.search.toLocaleLowerCase('vi').includes(query)
        || card.querySelector('.product-name').textContent.toLocaleLowerCase('vi').includes(query);
      const visible = categoryMatches && queryMatches;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    countLabel.textContent = `${visibleCount} sản phẩm`;
    emptyProducts.hidden = visibleCount !== 0;
  }

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    filterProducts();
    document.getElementById('goi-y').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  searchInput.addEventListener('input', filterProducts);
  document.querySelectorAll('.category-filter').forEach(button => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.category;
      document.querySelectorAll('.mall-categories .category-filter').forEach(item =>
        item.classList.toggle('active', item.dataset.category === selectedCategory));
      filterProducts();
      document.getElementById('goi-y').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.getElementById('copy-token').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(token);
      setMessage(homeMessage, 'Đã sao chép JWT. Dùng header Authorization: Bearer khi gọi API.', 'success');
    } catch {
      setMessage(homeMessage, 'Trình duyệt không cho phép sao chép token.', 'error');
    }
  });

  document.getElementById('logout-button').addEventListener('click', async () => {
    try {
      await request('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
    } catch { /* Always remove the token from this tab, even when the server is offline. */ }
    clearToken();
    goLogin();
  });
})();
