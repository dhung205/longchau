(async () => {
  const auth = window.Identify;
  const token = auth.getToken();
  if (!token) { auth.goLogin(); return; }
  try {
    const info = await auth.request('/users/myInfo', { headers: { Authorization: `Bearer ${token}` } });
    const roles = (info.result?.roles || []).map(role => role.name);
    if (!roles.includes('USER')) {
      const page = roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : 'home.html';
      location.replace(`${auth.API_BASE}/${page}`); return;
    }
  } catch { auth.clearToken(); auth.goLogin(); return; }

  const key = 'identify.shopCart';
  const lines = document.getElementById('cart-lines');
  const total = document.getElementById('cart-total');
  const subtotal = document.getElementById('cart-subtotal');
  const checkout = document.getElementById('checkout-form');
  const message = document.getElementById('checkout-message');
  const checkoutFields = document.getElementById('cart-checkout-fields');
  const buyButton = document.getElementById('cart-buy-button');
  const selectAll = document.getElementById('cart-select-all');
  const shippingSelect = document.getElementById('shipping-method');
  const deliveryFields = document.getElementById('delivery-fields');
  const pickupFields = document.getElementById('pickup-fields');
  const provinceSelect = document.getElementById('delivery-province');
  const districtSelect = document.getElementById('delivery-district');
  const qrDialog = document.getElementById('qr-payment-dialog');
  let pendingQrOrder = null;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch { cart = []; }
  cart = cart.filter(item => item && item.id != null).map(item => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1), selected: item.selected !== false }));

  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}`;
  const selectedItems = () => cart.filter(item => item.selected);
  const selectedTotal = () => selectedItems().reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  function persist() { localStorage.setItem(key, JSON.stringify(cart)); render(); }

  const addressData = Array.isArray(window.VN_ADDRESS_DATA) ? window.VN_ADDRESS_DATA : [];
  addressData.forEach(item => provinceSelect.add(new Option(item.city, item.city)));
  provinceSelect.addEventListener('change', () => {
    districtSelect.replaceChildren(new Option('Chọn quận/huyện', ''));
    const city = addressData.find(item => item.city === provinceSelect.value);
    (city?.districts || []).forEach(name => districtSelect.add(new Option(name, name)));
    districtSelect.disabled = !city;
  });

  function updateShippingFields() {
    const delivery = shippingSelect.value === 'DELIVERY';
    deliveryFields.hidden = !delivery; pickupFields.hidden = delivery;
    ['delivery-province','delivery-district','delivery-address'].forEach(id => document.getElementById(id).required = delivery);
    document.getElementById('pickup-store').required = !delivery;
    if (delivery && !provinceSelect.value) districtSelect.disabled = true;
  }

  function render() {
    lines.replaceChildren();
    const selected = selectedItems();
    const selectedQty = selected.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-item-count').textContent = `${cart.length} sản phẩm`;
    document.getElementById('cart-selected-count').textContent = `${selected.length}/${cart.length}`;
    selectAll.checked = cart.length > 0 && selected.length === cart.length;
    selectAll.indeterminate = selected.length > 0 && selected.length < cart.length;

    if (!cart.length) {
      lines.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><h2>Giỏ hàng đang trống</h2><p>Chọn những sản phẩm bạn cần, chúng sẽ xuất hiện tại đây.</p><a href="home.html#products">Khám phá sản phẩm</a></div>';
    } else {
      cart.forEach(item => {
        const row = document.createElement('article'); row.className = 'shop-cart-item';
        const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'cart-item-check'; check.checked = item.selected; check.setAttribute('aria-label', `Chọn ${item.name}`);
        check.onchange = () => { item.selected = check.checked; persist(); };
        const image = document.createElement('img'); image.src = item.imageData || 'assets/images/medicine-placeholder.svg'; image.alt = item.name;
        const info = document.createElement('div'); info.className = 'cart-item-info';
        const name = document.createElement('strong'); name.textContent = item.name;
        const unitPrice = document.createElement('small'); unitPrice.textContent = `${money(item.price)} / sản phẩm`;
        info.append(name, unitPrice);
        const quantity = document.createElement('div'); quantity.className = 'cart-quantity-control';
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Giảm số lượng');
        const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.value = String(item.quantity); input.setAttribute('aria-label', `Số lượng ${item.name}`);
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Tăng số lượng');
        minus.onclick = () => { item.quantity = Math.max(1, item.quantity - 1); persist(); };
        plus.onclick = () => { item.quantity += 1; persist(); };
        input.onchange = () => { item.quantity = Math.max(1, Number(input.value) || 1); persist(); };
        quantity.append(minus, input, plus);
        const linePrice = document.createElement('strong'); linePrice.className = 'cart-line-total'; linePrice.textContent = money((Number(item.price) || 0) * item.quantity);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cart-remove'; remove.title = 'Xóa sản phẩm'; remove.setAttribute('aria-label', `Xóa ${item.name}`); remove.textContent = '×';
        remove.onclick = () => { cart = cart.filter(entry => String(entry.id) !== String(item.id)); persist(); };
        row.append(check, image, info, quantity, linePrice, remove); lines.append(row);
      });
    }

    const amount = selectedTotal();
    subtotal.textContent = money(amount); total.textContent = money(amount);
    buyButton.disabled = selectedQty === 0;
  }

  selectAll.addEventListener('change', () => { cart.forEach(item => item.selected = selectAll.checked); persist(); });
  buyButton.addEventListener('click', () => {
    if (!selectedItems().length) return;
    checkoutFields.hidden = false;
    buyButton.type = 'submit';
    buyButton.textContent = 'Xác nhận đặt hàng';
    checkoutFields.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  document.getElementById('cart-voucher-button').addEventListener('click', () => {
    document.getElementById('cart-voucher-message').textContent = 'Hiện chưa có voucher áp dụng cho giỏ hàng này.';
  });
  shippingSelect.addEventListener('change', updateShippingFields);
  checkout.addEventListener('submit', async event => {
    event.preventDefault();
    const bought = selectedItems();
    if (!bought.length) return;
    const fields = Object.fromEntries(new FormData(checkout));
    const submit = checkout.querySelector('button[type="submit"]');
    submit.disabled = true; submit.textContent = 'Đang tạo đơn…';
    try {
      const order = await auth.request('/orders', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, items: bought.map(item => ({ medicineId: item.id, quantity: item.quantity })) }) });
      cart = cart.filter(item => !item.selected); persist();
      checkout.reset(); provinceSelect.dispatchEvent(new Event('change')); updateShippingFields();
      if (order.paymentMethod === 'QR') {
        pendingQrOrder = order.id;
        document.getElementById('qr-order-info').textContent = `Mã đơn ${order.id} · Tổng tiền ${money(order.total)}`;
        qrDialog.showModal();
      } else {
        message.innerHTML = `Đặt hàng thành công. Mã đơn <b>${order.id}</b>. <a href="orders.html">Xem đơn hàng</a>`;
      }
    } catch (error) {
      message.textContent = `Chưa đặt được hàng: ${error.message}`;
    } finally { submit.textContent = 'Xác nhận đặt hàng'; render(); }
  });
  document.getElementById('confirm-qr-payment').addEventListener('click', async () => {
    if (!pendingQrOrder) return;
    const button = document.getElementById('confirm-qr-payment'); button.disabled = true;
    try {
      await auth.request(`/orders/${encodeURIComponent(pendingQrOrder)}/confirm-qr-payment`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      qrDialog.close(); message.innerHTML = `Đã ghi nhận thanh toán thử nghiệm cho đơn <b>${pendingQrOrder}</b>. <a href="orders.html">Xem đơn hàng</a>`;
      pendingQrOrder = null;
    } catch (error) { document.getElementById('qr-order-info').textContent = `Không xác nhận được: ${error.message}`; }
    finally { button.disabled = false; }
  });
  document.getElementById('close-qr-payment').addEventListener('click', () => { qrDialog.close(); message.textContent = 'Đơn đã tạo và đang chờ thanh toán. Bạn có thể xem trong mục Đơn hàng của tôi.'; pendingQrOrder = null; });
  updateShippingFields();
  persist();
})();
