(() => {
  const byId = id => document.getElementById(id);
  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}`;
  const productSection = byId('detail-product');
  const errorSection = byId('detail-state');
  const id = new URLSearchParams(location.search).get('id');
  const queryInput = byId('product-search');
  const accountLink = byId('product-account');
  const token = window.Identify.getToken();
  let userCanShop = false;
  let currentMedicine = null;
  if (!token) localStorage.removeItem('identify.shopCart');
  if (token) {
    accountLink.href = 'home.html';
    try {
      const claims = window.Identify.decodeToken(token);
      accountLink.textContent = claims.sub || 'Tài khoản';
    } catch {
      accountLink.textContent = 'Tài khoản';
    }
    window.Identify.request('/users/myInfo', { headers: { Authorization: `Bearer ${token}` } })
      .then(body => {
        const user = body.result || {};
        const roles = (user.roles || []).map(role => role.name);
        userCanShop = roles.includes('USER');
        if (!userCanShop) localStorage.removeItem('identify.shopCart');
        accountLink.textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || accountLink.textContent;
        if (currentMedicine) display(currentMedicine);
      })
      .catch(() => { localStorage.removeItem('identify.shopCart'); });
  }
  const search = () => { const query = queryInput.value.trim(); location.href = query ? `home.html?q=${encodeURIComponent(query)}#products` : 'home.html#products'; };
  byId('product-search-button').addEventListener('click', search);
  queryInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });

  function showError(text) { byId('detail-error').textContent = text; errorSection.hidden = false; productSection.hidden = true; }
  function display(medicine) {
    currentMedicine = medicine;
    const stock = Math.max(0, Number(medicine.stock) || 0);
    byId('detail-breadcrumb-name').textContent = medicine.name;
    byId('detail-category').textContent = medicine.category || 'Nhóm sản phẩm';
    byId('detail-name').textContent = medicine.name;
    byId('detail-code').textContent = String(medicine.id || '').slice(0, 8).toUpperCase();
    byId('detail-price-value').textContent = money(medicine.price);
    byId('detail-description').textContent = medicine.functionText || 'Thông tin mô tả đang được cập nhật.';
    byId('detail-function').textContent = medicine.functionText || 'Chưa cập nhật.';
    byId('detail-recommendation').textContent = medicine.recommendation || 'Đọc kỹ hướng dẫn sử dụng trên bao bì.';
    byId('detail-fact-category').textContent = medicine.category || 'Chưa phân loại';
    byId('detail-ingredient').textContent = medicine.ingredient || 'Chưa cập nhật';
    byId('detail-expiry').textContent = medicine.expiryDate || 'Chưa cập nhật';
    byId('detail-stock-fact').textContent = stock ? `${stock} sản phẩm` : 'Tạm hết hàng';
    const stockLabel = byId('detail-stock');
    stockLabel.textContent = stock ? `Còn ${stock} sản phẩm` : 'Tạm hết hàng';
    stockLabel.classList.toggle('is-empty', stock === 0);
    const image = byId('detail-image');
    image.hidden = !medicine.imageData;
    image.src = medicine.imageData || '';
    byId('detail-image-empty').hidden = Boolean(medicine.imageData);
    const quantity = byId('detail-quantity');
    quantity.max = String(stock || 1);
    quantity.value = '1';
    quantity.disabled = stock === 0 || !userCanShop;
    byId('detail-minus').disabled = stock === 0 || !userCanShop;
    byId('detail-plus').disabled = stock === 0 || !userCanShop;
    const buy = byId('detail-buy');
    buy.disabled = stock === 0;
    buy.textContent = stock === 0 ? 'Hết hàng' : userCanShop ? 'Chọn mua' : 'Đăng nhập để mua';
    buy.onclick = () => {
      if (!userCanShop) { window.Identify.goLogin(); return; }
      const amount = Math.min(stock, Math.max(1, Number(quantity.value) || 1));
      let cart = [];
      try { cart = JSON.parse(localStorage.getItem('identify.shopCart') || '[]'); } catch {}
      const line = cart.find(item => String(item.id) === String(medicine.id));
      if (line) { line.quantity = Math.min(stock, (Number(line.quantity) || 0) + amount); line.selected = true; }
      else cart.push({ id: medicine.id, name: medicine.name, price: Number(medicine.price) || 0, quantity: amount, imageData: medicine.imageData || '', selected: true });
      localStorage.setItem('identify.shopCart', JSON.stringify(cart));
      buy.textContent = 'Đã thêm vào giỏ ✓';
      setTimeout(() => { buy.textContent = 'Chọn mua'; }, 1200);
    };
    byId('detail-minus').onclick = () => quantity.value = String(Math.max(1, Number(quantity.value) - 1));
    byId('detail-plus').onclick = () => quantity.value = String(Math.min(stock, Number(quantity.value) + 1));
    quantity.onchange = () => quantity.value = String(Math.min(stock || 1, Math.max(1, Number(quantity.value) || 1)));
    productSection.hidden = false;
  }

  if (!id) { showError('Mã thuốc không có trong đường dẫn.'); return; }
  window.Identify.request('/catalog/medicines')
    .then(items => { const medicine = items.find(item => String(item.id) === id); if (medicine) display(medicine); else showError('Thuốc có thể đã bị xóa khỏi danh mục.'); })
    .catch(() => showError('Không tải được thông tin thuốc. Hãy tải lại trang sau ít phút.'));
})();
