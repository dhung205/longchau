(() => {
  const body = document.body;
  const list = document.getElementById('customers-list');
  const message = document.getElementById('customers-message');
  const count = document.getElementById('customers-count');
  const search = document.getElementById('customers-search');
  if (!body?.dataset.role || !list || !message || !count) return;

  let customers = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const displayDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

  function render() {
    const query = (search?.value || '').trim().toLocaleLowerCase('vi-VN');
    const filtered = customers.filter(customer => `${customer.name} ${customer.phone} ${customer.address}`.toLocaleLowerCase('vi-VN').includes(query));
    count.textContent = `${customers.length} khách hàng`;
    if (!filtered.length) {
      list.innerHTML = `<tr><td class="customers-empty" colspan="5">${customers.length ? 'Không tìm thấy khách hàng phù hợp.' : 'Chưa có khách hàng từ các đơn hàng.'}</td></tr>`;
      return;
    }
    list.innerHTML = filtered.map(customer => `<tr><td><strong>${esc(customer.name || 'Khách mua hàng')}</strong></td><td>${esc(customer.phone || '—')}</td><td>${esc(customer.address || '—')}</td><td>${customer.orders}</td><td>${displayDate(customer.lastOrder)}</td></tr>`).join('');
  }

  search?.addEventListener('input', render);
  window.Identify.request('/orders/manage', { headers: { Authorization: `Bearer ${window.Identify.getToken()}` } })
    .then(orders => {
      const grouped = new Map();
      (Array.isArray(orders) ? orders : []).filter(order => order.status !== 'CANCELLED').forEach(order => {
        const key = String(order.phone || order.recipientName || order.id || '').trim().toLocaleLowerCase('vi-VN');
        if (!key) return;
        const current = grouped.get(key) || { name: order.recipientName, phone: order.phone, address: [order.address, order.district, order.province].filter(Boolean).join(', '), orders: 0, lastOrder: order.createdAt };
        current.orders += 1;
        if (new Date(order.createdAt || 0) > new Date(current.lastOrder || 0)) {
          current.lastOrder = order.createdAt;
          current.name = order.recipientName || current.name;
          current.phone = order.phone || current.phone;
          current.address = [order.address, order.district, order.province].filter(Boolean).join(', ') || current.address;
        }
        grouped.set(key, current);
      });
      customers = [...grouped.values()].sort((a, b) => String(b.lastOrder || '').localeCompare(String(a.lastOrder || '')));
      message.hidden = true;
      render();
    })
    .catch(error => { message.textContent = `Không tải được khách hàng: ${error.message}`; list.innerHTML = ''; });
})();