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
  const discountNode = document.getElementById('cart-discount');
  const voucherCodeInput = document.getElementById('cart-voucher-code');
  const voucherList = document.createElement('div');
  voucherList.className = 'cart-voucher-list';
  voucherList.setAttribute('role', 'group');
  voucherList.setAttribute('aria-label', 'Danh sách voucher');
  voucherCodeInput.hidden = true;
  voucherCodeInput.before(voucherList);
  const voucherButton = document.getElementById('cart-voucher-button');
  const voucherMessage = document.getElementById('cart-voucher-message');
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
  let appliedVoucher = null;
  let lastVoucherAmount = null;
  let voucherRequest = 0;
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
    if (lastVoucherAmount !== amount) { lastVoucherAmount = amount; loadVouchers(amount); }
    if (appliedVoucher && appliedVoucher.subtotal !== amount) {
      appliedVoucher = null;
      voucherMessage.textContent = 'Giỏ hàng đã thay đổi. Vui lòng áp dụng lại voucher.';
      voucherMessage.classList.remove('is-success');
    }
    const discount = appliedVoucher ? Math.min(amount, appliedVoucher.discount) : 0;
    subtotal.textContent = money(amount); discountNode.textContent = money(discount); total.textContent = money(amount - discount);
    buyButton.disabled = selectedQty === 0;
  }

  async function loadVouchers(amount) {
    const requestId = ++voucherRequest;
    voucherCodeInput.disabled = true;
    voucherButton.disabled = true;
    voucherList.textContent = 'Đang tải voucher…';
    voucherCodeInput.replaceChildren(new Option('Đang tải voucher…', ''));
    try {
      const vouchers = await auth.request('/vouchers?subtotal=' + amount, { headers: { Authorization: 'Bearer ' + token } });
      if (requestId !== voucherRequest) return;
      voucherCodeInput.replaceChildren(new Option(vouchers.length ? 'Chọn voucher' : 'Chưa có voucher phù hợp', ''));
      voucherList.replaceChildren();
      if (!vouchers.length) voucherList.textContent = 'Chưa có voucher phù hợp với đơn hàng.';
      vouchers.forEach(v => {
        voucherCodeInput.add(new Option(v.title, v.code));
        const label = document.createElement('label'); label.className = 'cart-voucher-card';
        const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'voucher-choice'; radio.value = v.code;
        const details = document.createElement('span');
        const title = document.createElement('b'); title.textContent = v.title;
        const code = document.createElement('small'); code.textContent = v.code + ' · Đơn từ ' + money(v.minimumSubtotal || 0) + ' ₫';
        const saving = document.createElement('strong'); saving.textContent = '−' + money(v.discount) + ' ₫';
        details.append(title, code); label.append(radio, details, saving);
        radio.addEventListener('change', () => { voucherCodeInput.value = v.code; voucherButton.disabled = false; });
        voucherList.append(label);
      });
      voucherCodeInput.disabled = !vouchers.length;
    } catch {
      if (requestId !== voucherRequest) return;
      voucherCodeInput.replaceChildren(new Option('Không tải được voucher', ''));
      voucherList.textContent = 'Không tải được danh sách voucher.';
      voucherMessage.textContent = 'Không tải được voucher. Vui lòng tải lại trang để thử lại.';
      lastVoucherAmount = null;
    }
  }
  selectAll.addEventListener('change', () => { cart.forEach(item => item.selected = selectAll.checked); persist(); });
  buyButton.addEventListener('click', () => {
    if (!selectedItems().length) return;
    checkoutFields.hidden = false;
    buyButton.type = 'submit';
    buyButton.textContent = 'Xác nhận đặt hàng';
    checkoutFields.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  voucherButton.addEventListener('click', async () => {
    const requestedSubtotal = selectedTotal();
    const code = voucherCodeInput.value.trim();
    if (!code) { voucherMessage.textContent = 'Chọn voucher để áp dụng.'; return; }
    if (!selectedItems().length) { voucherMessage.textContent = 'Chọn sản phẩm trong giỏ trước.'; return; }
    voucherButton.disabled = true;
    voucherMessage.classList.remove('is-success');
    voucherMessage.textContent = 'Đang kiểm tra mã…';
    try {
      const quote = await auth.request('/vouchers/validate', { method:'POST', headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ code, subtotal:requestedSubtotal }) });
      if (requestedSubtotal !== selectedTotal()) return;
      appliedVoucher = { code:quote.code, title:quote.title, subtotal:Number(quote.subtotal), discount:Number(quote.discount) };
      voucherCodeInput.value = quote.code;
      voucherMessage.textContent = `${quote.title} đã áp dụng. Bạn tiết kiệm ${money(quote.discount)}.`;
      voucherMessage.classList.add('is-success');
      render();
    } catch (error) {
      appliedVoucher = null;
      voucherMessage.textContent = error.message || 'Mã voucher không hợp lệ.';
      render();
    } finally { voucherButton.disabled = voucherCodeInput.disabled || !voucherCodeInput.value; }
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
      const order = await auth.request('/orders', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, voucherCode: appliedVoucher?.code || null, items: bought.map(item => ({ medicineId: item.id, quantity: item.quantity })) }) });
      cart = cart.filter(item => !item.selected); persist();
      appliedVoucher = null; voucherCodeInput.value = ''; voucherMessage.textContent = 'Chọn voucher phù hợp để được giảm giá.'; voucherMessage.classList.remove('is-success');
      checkout.reset(); provinceSelect.dispatchEvent(new Event('change')); updateShippingFields();
      if (order.paymentMethod === 'QR') {
        pendingQrOrder = order.id;
        document.getElementById('qr-order-info').textContent = `Mã đơn ${order.id} · Tổng tiền ${money(order.total)} · Hạn xác nhận: ${order.paymentExpiresAt ? new Date(order.paymentExpiresAt).toLocaleString('vi-VN') : '15 phút'}`;
        qrDialog.showModal();
      } else {
        message.innerHTML = `Đặt hàng thành công. Mã đơn <b>${order.id}</b>. <a href="orders.html">Xem đơn hàng</a>`;
      }
    } catch (error) {
      message.textContent = `Chưa đặt được hàng: ${error.message}`;
    } finally { submit.textContent = 'Xác nhận đặt hàng'; render(); }
  });
  document.getElementById('confirm-qr-payment').addEventListener('click', () => { qrDialog.close(); message.textContent = 'Vui lòng chờ nhân viên kiểm tra và xác nhận thanh toán.'; });
  document.getElementById('close-qr-payment').addEventListener('click', () => { qrDialog.close(); message.textContent = 'Đơn đã tạo và đang chờ thanh toán. Bạn có thể xem trong mục Đơn hàng của tôi.'; pendingQrOrder = null; });
  updateShippingFields();
  persist();
})();
