(async () => {
  const api = window.Identify;
  const token = api.getToken();
  if (!token) { api.goLogin(); return; }
  const headers = { Authorization: `Bearer ${token}` };
  let role = '';
  try {
    const info = await api.request('/users/myInfo', { headers });
    const roles = (info.result?.roles || []).map(item => item.name);
    role = roles.includes('ADMIN') ? 'ADMIN' : roles.includes('STAFF') ? 'STAFF' : '';
    if (!role) { location.replace(`${api.API_BASE}/home.html`); return; }
  } catch { api.clearToken(); api.goLogin(); return; }

  const workspaceLink = document.getElementById('back-workspace');
  workspaceLink.href = role === 'ADMIN' ? 'admin.html' : 'staff.html';
  workspaceLink.textContent = role === 'ADMIN' ? 'Về trang quản trị' : 'Về trang nhân viên';
  document.getElementById('manage-order-dialog').classList.add('manager-detail-dialog');
  const list = document.getElementById('manage-orders-list');
  const message = document.getElementById('manage-orders-message');
  const detailDialog = document.getElementById('manage-order-dialog');
  const detail = document.getElementById('manage-order-detail');
  const search = document.getElementById('order-search');
  const filter = document.getElementById('order-status-filter');
  const money = amount => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}`;
  const statusNames = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Giao hàng thành công', CANCELLED: 'Đã hủy' };
  const nextStatus = { PENDING: ['CONFIRMED', 'Xác nhận đơn hàng'], CONFIRMED: ['SHIPPING', 'Bắt đầu giao hàng'], SHIPPING: ['DELIVERED', 'Xác nhận giao thành công'] };
  let orders = [];

  function refreshStats() {
    for (const status of ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'])
      document.getElementById(`count-${status.toLowerCase()}`).textContent = orders.filter(order => order.status === status).length;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase('vi');
    const rows = orders.filter(order => {
      const matchesStatus = filter.value === 'ALL' || order.status === filter.value;
      const haystack = [order.id, order.recipientName, order.phone, ...(order.items || []).map(item => item.medicineName)].join(' ').toLocaleLowerCase('vi');
      return matchesStatus && (!query || haystack.includes(query));
    });
    list.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('div'); empty.className = 'manage-empty';
      empty.textContent = orders.length ? 'Không có đơn phù hợp với nội dung tìm kiếm.' : 'Chưa có đơn hàng nào được đặt.';
      list.append(empty); return;
    }
    rows.forEach(order => list.append(createCard(order)));
  }

  function createCard(order) {
    const card = document.createElement('article'); card.className = 'manage-order-card';
    const header = document.createElement('div'); header.className = 'manage-order-card-header';
    const identity = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = `Đơn #${order.id.slice(0, 8).toUpperCase()}`;
    const date = document.createElement('small'); date.textContent = new Date(order.createdAt).toLocaleString('vi-VN'); identity.append(title, date);
    const badge = document.createElement('span'); badge.className = `order-status status-${order.status.toLowerCase()}`; badge.textContent = statusNames[order.status] || order.status;
    header.append(identity, badge);
    const meta = document.createElement('div'); meta.className = 'manage-order-meta';
    const recipient = document.createElement('span'); recipient.textContent = `Người nhận: ${order.recipientName}`;
    const phone = document.createElement('span'); phone.textContent = `Điện thoại: ${order.phone}`;
    const shipping = document.createElement('span'); shipping.textContent = order.shippingMethod === 'PICKUP' ? `Nhận tại: ${order.pickupStore || 'Nhà thuốc'}` : `Giao đến: ${[order.address, order.district, order.province].filter(Boolean).join(', ')}`;
    const payment = document.createElement('span'); payment.textContent = order.paymentMethod === 'QR' ? (order.paymentStatus === 'PAID' ? 'QR · Đã thanh toán' : 'QR · Chờ khách thanh toán') : 'Tiền mặt khi nhận';
    meta.append(recipient, phone, shipping, payment);
    const products = document.createElement('p'); products.className = 'manage-order-products'; products.textContent = (order.items || []).map(item => `${item.medicineName} × ${item.quantity}`).join(' · ');
    const footer = document.createElement('div'); footer.className = 'manage-order-card-footer';
    const total = document.createElement('strong'); total.className = 'manage-order-total'; total.textContent = money(order.total);
    const actions = document.createElement('div'); actions.className = 'manage-order-actions';
    const view = document.createElement('button'); view.type = 'button'; view.textContent = 'Xem chi tiết'; view.addEventListener('click', () => showDetail(order.id)); actions.append(view);
    if (nextStatus[order.status]) {
      const [target, label] = nextStatus[order.status];
      const advance = document.createElement('button'); advance.type = 'button'; advance.className = 'orders-primary'; advance.textContent = label;
      const blockedByPayment = order.paymentMethod === 'QR' && order.paymentStatus !== 'PAID' && order.status === 'PENDING';
      advance.disabled = blockedByPayment;
      if (blockedByPayment) advance.title = 'Khách cần thanh toán QR trước khi xác nhận.';
      advance.addEventListener('click', () => changeStatus(order, target)); actions.append(advance);
    }
    footer.append(total, actions); card.append(header, meta, products, footer); return card;
  }

  async function load() {
    message.textContent = 'Đang tải đơn hàng…';
    try {
      orders = await api.request('/orders/manage', { headers });
      refreshStats(); render(); message.textContent = '';
    } catch (error) { message.textContent = `Không tải được đơn hàng: ${error.message}`; }
  }

  async function changeStatus(order, status) {
    const confirmText = status === 'CONFIRMED' ? `Xác nhận đơn #${order.id.slice(0, 8).toUpperCase()}?` : status === 'SHIPPING' ? 'Chuyển đơn sang trạng thái đang giao?' : 'Xác nhận khách đã nhận được hàng?';
    if (!window.confirm(confirmText)) return;
    message.textContent = 'Đang cập nhật trạng thái…';
    try {
      await api.request(`/orders/manage/${encodeURIComponent(order.id)}/status`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      await load();
      message.textContent = `Đã cập nhật: ${statusNames[status]}.`;
    } catch (error) { message.textContent = `Không cập nhật được đơn: ${error.message}`; }
  }

  async function showDetail(id) {
    detail.replaceChildren();
    try {
      const order = await api.request(`/orders/manage/${encodeURIComponent(id)}`, { headers });
      const title = document.createElement('h2'); title.textContent = `Chi tiết đơn #${order.id.slice(0, 8).toUpperCase()}`;
      const status = document.createElement('p'); status.className = `order-detail-status status-${order.status.toLowerCase()}`; status.textContent = statusNames[order.status] || order.status;
      const grid = document.createElement('div'); grid.className = 'manage-order-detail-grid';
      const values = [
        ['Người nhận', order.recipientName], ['Số điện thoại', order.phone],
        ['Hình thức nhận', order.shippingMethod === 'PICKUP' ? 'Nhận tại nhà thuốc' : 'Giao tận nơi'],
        ['Địa chỉ', order.shippingMethod === 'PICKUP' ? order.pickupStore : [order.address, order.district, order.province].filter(Boolean).join(', ')],
        ['Thanh toán', order.paymentMethod === 'QR' ? (order.paymentStatus === 'PAID' ? 'QR · Đã thanh toán' : 'QR · Chờ thanh toán') : 'Tiền mặt khi nhận'],
        ['Ngày đặt', new Date(order.createdAt).toLocaleString('vi-VN')]
      ];
      values.forEach(([label, value]) => { const cell = document.createElement('div'); const caption = document.createElement('small'); caption.textContent = label; const text = document.createElement('b'); text.textContent = value || 'Chưa cung cấp'; cell.append(caption, text); grid.append(cell); });
      const items = document.createElement('div'); items.className = 'order-detail-items';
      (order.items || []).forEach(item => { const row = document.createElement('div'); row.className = 'order-detail-item'; const name = document.createElement('span'); name.textContent = `${item.medicineName} × ${item.quantity}`; const price = document.createElement('b'); price.textContent = money(item.unitPrice * item.quantity); row.append(name, price); items.append(row); });
      const total = document.createElement('strong'); total.className = 'order-detail-total'; total.textContent = `Tổng thanh toán: ${money(order.total)}`;
      detail.append(title, status, grid, items, total);
      if (order.note) { const note = document.createElement('p'); note.textContent = `Ghi chú: ${order.note}`; detail.append(note); }
      detailDialog.showModal();
    } catch (error) { message.textContent = `Không tải được chi tiết đơn: ${error.message}`; }
  }

  document.getElementById('orders-refresh').addEventListener('click', load);
  document.getElementById('manage-detail-close').addEventListener('click', () => detailDialog.close());
  search.addEventListener('input', render); filter.addEventListener('change', render);
  document.getElementById('manager-logout').addEventListener('click', async () => {
    try { await api.request('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); } catch {}
    api.clearToken(); api.goLogin();
  });
  load();
})();
