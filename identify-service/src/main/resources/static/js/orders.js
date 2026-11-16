(async () => {
  const api = window.Identify;
  const token = api.getToken();
  if (!token) { api.goLogin(); return; }
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const info = await api.request('/users/myInfo', { headers });
    const roles = (info.result?.roles || []).map(role => role.name);
    if (!roles.includes('USER')) { location.replace(`${api.API_BASE}/${roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : 'home.html'}`); return; }
  } catch { api.clearToken(); api.goLogin(); return; }

  const list = document.getElementById('orders-list');
  const message = document.getElementById('orders-message');
  const dialog = document.getElementById('order-detail-dialog');
  const qrDialog = document.getElementById('orders-qr-dialog');
  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}`;
  const statusText = status => ({ READY_FOR_PICKUP: 'Sẵn sàng nhận', PICKED_UP: 'Đã nhận hàng', PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Giao hàng thành công', CANCELLED: 'Đã hủy' }[status] || status);
  const payText = status => ({ UNPAID: 'Thanh toán khi nhận', PENDING: 'Chờ thanh toán QR', PAID: 'Đã thanh toán' }[status] || status);
  let pendingPaymentOrder = null;

  async function loadOrders() {
    list.replaceChildren();
    try {
      const orders = await api.request('/orders/my', { headers });
      if (!orders.length) { list.innerHTML = '<div class="orders-empty"><span>▣</span><h2>Bạn chưa có đơn hàng</h2><p>Sản phẩm đã đặt sẽ hiển thị tại đây.</p><a href="home.html#products">Khám phá sản phẩm</a></div>'; return; }
      orders.forEach(order => list.append(createOrderCard(order)));
    } catch (error) { message.textContent = `Không tải được đơn hàng: ${error.message}`; }
  }

  function createOrderCard(order) {
    const card = document.createElement('article'); card.className = 'order-card';
    const top = document.createElement('div'); top.className = 'order-card-top';
    const heading = document.createElement('div');
    const id = document.createElement('strong'); id.textContent = `Đơn hàng #${order.id.slice(0, 8).toUpperCase()}`;
    const date = document.createElement('small'); date.textContent = new Date(order.createdAt).toLocaleString('vi-VN'); heading.append(id, date);
    const status = document.createElement('span'); status.className = `order-status status-${order.status.toLowerCase()}`; status.textContent = statusText(order.status); top.append(heading, status);
    const preview = document.createElement('p'); preview.className = 'order-items-preview'; preview.textContent = (order.items || []).map(item => `${item.medicineName} × ${item.quantity}`).join(' · ');
    const bottom = document.createElement('div'); bottom.className = 'order-card-bottom';
    const total = document.createElement('strong'); total.textContent = `Tổng tiền: ${money(order.total)}`;
    const actions = document.createElement('div'); actions.className = 'order-card-actions';
    const detail = document.createElement('button'); detail.type = 'button'; detail.textContent = 'Xem chi tiết'; detail.onclick = () => showDetail(order.id);
    actions.append(detail);
    if (order.status === 'PENDING') {
      if (order.paymentMethod === 'QR' && order.paymentStatus === 'PENDING') {
        const pay = document.createElement('button'); pay.type = 'button'; pay.className = 'orders-primary'; pay.textContent = 'Thanh toán QR'; pay.onclick = () => showQr(order); actions.append(pay);
      }
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'order-cancel'; cancel.textContent = 'Hủy đơn'; cancel.onclick = () => cancelOrder(order); actions.append(cancel);
    }
    bottom.append(total, actions); card.append(top, preview, bottom); return card;
  }

  async function showDetail(id) {
    const content = document.getElementById('order-detail-content'); content.replaceChildren();
    try {
      const order = await api.request(`/orders/${encodeURIComponent(id)}`, { headers });
      const title = document.createElement('h2'); title.textContent = `Chi tiết đơn hàng ${order.id.slice(0, 8).toUpperCase()}`;
      const status = document.createElement('p'); status.className = `order-detail-status status-${order.status.toLowerCase()}`; status.textContent = `${statusText(order.status)} · ${payText(order.paymentStatus)}`;
      const date = document.createElement('p'); date.className = 'order-detail-date'; date.textContent = `Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}`;
      const items = document.createElement('div'); items.className = 'order-detail-items';
      (order.items || []).forEach(item => { const row = document.createElement('div'); row.className = 'order-detail-item'; const name = document.createElement('span'); name.textContent = `${item.medicineName} × ${item.quantity}`; const price = document.createElement('b'); price.textContent = money(item.unitPrice * item.quantity); row.append(name, price); items.append(row); });
      const recipient = document.createElement('div'); recipient.className = 'order-recipient-detail';
      const destination = order.shippingMethod === 'DELIVERY' ? [order.address, order.district, order.province].filter(Boolean).join(', ') : `Nhận tại: ${order.pickupStore || 'Nhà thuốc'}`;
      recipient.textContent = `${order.recipientName} · ${order.phone} · ${destination}`;
      const total = document.createElement('strong'); total.className = 'order-detail-total'; total.textContent = `Tổng thanh toán: ${money(order.total)}`;
      const breakdown = document.createElement('p'); breakdown.textContent = 'Tạm tính: ' + money(order.subtotal) + ' · Voucher: ' + (order.voucherCode || 'Không có') + ' · Giảm: ' + money(order.discount);
      content.append(title, status, date, items, recipient, breakdown, total);
      if (order.status === 'PENDING') {
        const actions = document.createElement('div'); actions.className = 'order-detail-actions';
        if (order.paymentMethod === 'QR' && order.paymentStatus === 'PENDING') { const pay = document.createElement('button'); pay.className = 'orders-primary'; pay.textContent = 'Thanh toán QR'; pay.onclick = () => { dialog.close(); showQr(order); }; actions.append(pay); }
        const cancel = document.createElement('button'); cancel.className = 'order-cancel'; cancel.textContent = 'Hủy đơn hàng'; cancel.onclick = async () => { dialog.close(); await cancelOrder(order); }; actions.append(cancel); content.append(actions);
      }
      dialog.showModal();
    } catch (error) { message.textContent = error.message.includes('404') ? 'Không tìm thấy đơn hàng.' : `Không tải được chi tiết đơn: ${error.message}`; }
  }

  async function cancelOrder(order) {
    if (!confirm(`Bạn có chắc muốn hủy đơn ${order.id.slice(0, 8).toUpperCase()} không?`)) return;
    try { await api.request(`/orders/${encodeURIComponent(order.id)}/cancel`, { method: 'POST', headers }); message.textContent = 'Đã hủy đơn hàng và hoàn lại số lượng tồn kho.'; await loadOrders(); }
    catch (error) { message.textContent = `Không thể hủy đơn: ${error.message}`; await loadOrders(); }
  }

  function showQr(order) {
    pendingPaymentOrder = order.id;
    document.getElementById('orders-qr-info').textContent = `Mã đơn ${order.id} · Tổng tiền ${money(order.total)} · Hạn xác nhận: ${order.paymentExpiresAt ? new Date(order.paymentExpiresAt).toLocaleString('vi-VN') : '15 phút'}`;
    qrDialog.showModal();
  }
  function confirmPayment() { qrDialog.close(); message.textContent = 'Vui lòng chờ nhân viên kiểm tra và xác nhận thanh toán.'; }
  document.getElementById('order-detail-close').addEventListener('click', () => dialog.close());
  document.getElementById('orders-confirm-payment').addEventListener('click', confirmPayment);
  document.querySelectorAll('[data-close-qr]').forEach(button => button.addEventListener('click', () => { qrDialog.close(); pendingPaymentOrder = null; }));
  loadOrders();
})();
