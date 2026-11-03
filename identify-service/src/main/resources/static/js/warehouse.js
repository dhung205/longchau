(() => {
  const api = window.Identify;
  const token = api.getToken();
  const stockList = document.getElementById('warehouse-stock-list');
  const stockMessage = document.getElementById('warehouse-stock-message');
  if (!stockList || !stockMessage) return;
  let medicines = [];
  const headers = { Authorization: `Bearer ${token}` };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const expiryState = medicine => {
    if (!medicine.expiryDate) return 'unknown';
    const expiry = new Date(`${medicine.expiryDate}T00:00:00`);
    const today = new Date(); today.setHours(0,0,0,0);
    const limit = new Date(today); limit.setDate(limit.getDate() + 90);
    return expiry < today ? 'expired' : expiry <= limit ? 'soon' : 'ok';
  };
  const expiring = medicine => ['expired','soon'].includes(expiryState(medicine));

  function render() {
    const query = (document.getElementById('warehouse-search')?.value || '').trim().toLocaleLowerCase('vi');
    const filter = document.getElementById('warehouse-stock-filter')?.value || 'ALL';
    const rows = medicines.filter(medicine => {
      const found = `${medicine.name} ${medicine.ingredient || ''} ${medicine.category || ''}`.toLocaleLowerCase('vi').includes(query);
      return found && (filter === 'ALL' || (filter === 'LOW' && Number(medicine.stock || 0) <= 5) || (filter === 'EXPIRING' && expiring(medicine)));
    });
    document.getElementById('warehouse-sku-count').textContent = String(medicines.length);
    document.getElementById('warehouse-stock-total').textContent = new Intl.NumberFormat('vi-VN').format(medicines.reduce((sum, medicine) => sum + Number(medicine.stock || 0), 0));
    document.getElementById('warehouse-low-count').textContent = String(medicines.filter(medicine => Number(medicine.stock || 0) <= 5).length);
    document.getElementById('warehouse-expiring-count').textContent = String(medicines.filter(expiring).length);
    if (!rows.length) { stockList.innerHTML = '<p class="warehouse-empty">Không có hàng hóa phù hợp.</p>'; return; }
    stockList.innerHTML = `<table class="warehouse-table"><thead><tr><th>HÀNG HÓA</th><th>HẠN DÙNG</th><th>TỒN KHO</th><th>TÌNH TRẠNG</th><th>THAO TÁC KHO</th></tr></thead><tbody>${rows.map(medicine => {
      const low = Number(medicine.stock || 0) <= 5;
      const expiry = expiryState(medicine);
      const expiryLabel = expiry === 'expired' ? 'Đã hết hạn' : expiry === 'soon' ? 'Sắp hết hạn' : expiry === 'ok' ? 'Còn hạn' : 'Chưa có hạn dùng';
      return `<tr><td><div class="warehouse-product"><img src="${medicine.imageData || 'assets/images/medicine-placeholder.svg'}" alt=""><span><b>${esc(medicine.name)}</b><small>${esc(medicine.category || 'Thuốc')} · ${esc(medicine.ingredient || 'Chưa có hoạt chất')}</small></span></div></td><td>${esc(medicine.expiryDate || '—')}<small class="warehouse-status ${expiry === 'soon' || expiry === 'expired' ? 'warning' : 'ok'}">${expiryLabel}</small></td><td><b>${Number(medicine.stock || 0)}</b> sản phẩm</td><td><span class="warehouse-status ${low ? 'warning' : 'ok'}">${low ? 'Cần bổ sung' : 'Đủ hàng'}</span></td><td><div class="warehouse-actions"><button type="button" data-receive="${esc(medicine.id)}">Nhập hàng</button><button type="button" data-count="${esc(medicine.id)}">Kiểm kê</button></div></td></tr>`;
    }).join('')}</tbody></table>`;
    stockList.querySelectorAll('[data-receive]').forEach(button => button.onclick = () => receive(button.dataset.receive));
    stockList.querySelectorAll('[data-count]').forEach(button => button.onclick = () => countStock(button.dataset.count));
  }

  async function load() {
    stockMessage.textContent = 'Đang tải hàng hóa…';
    try { medicines = await api.request('/catalog/medicines'); render(); stockMessage.textContent = ''; }
    catch (error) { stockMessage.textContent = `Không tải được hàng hóa: ${error.message}`; }
  }
  async function saveStock(medicine, stock, success) {
    try {
      const body = { name:medicine.name, ingredient:medicine.ingredient, category:medicine.category, expiryDate:medicine.expiryDate, price:medicine.price, stock, functionText:medicine.functionText, recommendation:medicine.recommendation, imageData:medicine.imageData };
      await api.request(`/medicines/${encodeURIComponent(medicine.id)}`, { method:'PUT', headers:{...headers,'Content-Type':'application/json'}, body:JSON.stringify(body) });
      stockMessage.textContent = success; await load();
    } catch (error) { stockMessage.textContent = `Không cập nhật được tồn kho: ${error.message}`; }
  }
  function receive(id) {
    const medicine = medicines.find(item => String(item.id) === String(id)); if (!medicine) return;
    const amount = Number(prompt(`Nhập số lượng nhận thêm cho ${medicine.name}:`, '1'));
    if (!Number.isInteger(amount) || amount <= 0) return;
    saveStock(medicine, Number(medicine.stock || 0) + amount, `Đã nhập thêm ${amount} sản phẩm ${medicine.name}.`);
  }
  function countStock(id) {
    const medicine = medicines.find(item => String(item.id) === String(id)); if (!medicine) return;
    const actual = Number(prompt(`Số lượng kiểm kê thực tế của ${medicine.name}:`, String(medicine.stock || 0)));
    if (!Number.isInteger(actual) || actual < 0) return;
    saveStock(medicine, actual, `Đã cập nhật tồn kho kiểm kê cho ${medicine.name}.`);
  }
  document.getElementById('warehouse-refresh').addEventListener('click', load);
  document.getElementById('warehouse-search').addEventListener('input', render);
  document.getElementById('warehouse-stock-filter').addEventListener('change', render);
  load();
})();