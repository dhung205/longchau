(() => {
  const fmt = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}`;
  const show = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const warning = new Date(today); warning.setDate(warning.getDate() + 90);
  window.Identify.request('/catalog/medicines').then(medicines => {
    const low = medicines.filter(medicine => Number(medicine.stock || 0) <= 5).length;
    const expiring = medicines.filter(medicine => {
      if (!medicine.expiryDate) return false;
      const expiry = new Date(`${medicine.expiryDate}T00:00:00`);
      return expiry >= today && expiry <= warning;
    }).length;
    show('dash-low-stock', String(low)); show('dash-expiring', String(expiring));
  }).catch(() => {});
  const chart = document.getElementById('dashboard-sales-chart');
  const periodSelect = document.getElementById('report-period');
  const periodValue = document.getElementById('report-period-value');
  const chartTitle = document.getElementById('report-chart-title');
  const chartSubtitle = document.getElementById('report-chart-subtitle');
  const reportSummary = document.getElementById('report-filter-summary');
  const reportFilters = document.querySelector('.report-filters');
  let exportButton = document.getElementById('report-export');
  if (reportFilters && !exportButton) {
    exportButton = document.createElement('button');
    exportButton.id = 'report-export';
    exportButton.type = 'button';
    exportButton.className = 'report-export-button';
    exportButton.textContent = 'Xuất Excel';
    exportButton.title = 'Tải báo cáo doanh thu đang chọn, mở bằng Excel';
    exportButton.disabled = true;
    reportFilters.append(exportButton);
  }
  const now = new Date();
  let allOrders = [];
  const pad = value => String(value).padStart(2, '0');

  function updatePeriodInput() {
    if (!periodSelect || !periodValue) return;
    const mode = periodSelect.value;
    periodValue.type = mode === 'day' ? 'date' : mode === 'month' ? 'month' : 'number';
    if (mode === 'day' && !periodValue.value) periodValue.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (mode === 'month' && !periodValue.value.includes('-')) periodValue.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    if (mode === 'year' && !/^\d{4}$/.test(periodValue.value)) periodValue.value = String(now.getFullYear());
    periodValue.min = mode === 'year' ? '2000' : '';
    periodValue.max = mode === 'year' ? String(now.getFullYear() + 5) : '';
    periodValue.step = mode === 'year' ? '1' : '';
  }

  function getPeriodData() {
    const mode = periodSelect?.value || 'month';
    const value = periodValue?.value || '';
    let buckets = [];
    let matches = () => false;
    let title = '';
    if (mode === 'day') {
      const [year, month, day] = value.split('-').map(Number);
      title = value ? new Date(year, month - 1, day).toLocaleDateString('vi-VN') : 'Chọn ngày';
      buckets = Array.from({ length: 24 }, (_, hour) => ({ label: `${pad(hour)}h`, total: 0, key: hour }));
      matches = date => value && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    } else if (mode === 'year') {
      const year = Number(value);
      title = value ? `Năm ${value}` : 'Chọn năm';
      buckets = Array.from({ length: 12 }, (_, month) => ({ label: `${pad(month + 1)}/${String(year).slice(-2)}`, total: 0, key: month }));
      matches = date => value && date.getFullYear() === year;
    } else {
      const [year, month] = value.split('-').map(Number);
      title = value ? new Date(year, month - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Chọn tháng';
      const daysInMonth = value ? new Date(year, month, 0).getDate() : 31;
      buckets = Array.from({ length: daysInMonth }, (_, day) => ({ label: String(day + 1), total: 0, key: day + 1 }));
      matches = date => value && date.getFullYear() === year && date.getMonth() === month - 1;
    }
    const orders = allOrders.filter(order => ['DELIVERED', 'PICKED_UP'].includes(order.status) && matches(new Date(order.createdAt)));
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const key = mode === 'day' ? date.getHours() : mode === 'year' ? date.getMonth() : date.getDate();
      const bucket = buckets.find(item => item.key === key);
      if (bucket) bucket.total += Number(order.total) || 0;
    });
    return { mode, title, orders, buckets };
  }

  function renderRevenueReport() {
    if (!chart || !periodSelect || !periodValue) return;
    const report = getPeriodData();
    const total = report.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    show('dash-revenue', fmt(total));
    if (chartTitle) chartTitle.textContent = report.mode === 'day' ? 'Doanh thu theo giờ' : report.mode === 'year' ? 'Doanh thu theo tháng' : 'Doanh thu theo ngày';
    if (chartSubtitle) chartSubtitle.textContent = `Đơn giao thành công · ${report.title}`;
    if (reportSummary) reportSummary.textContent = `${report.orders.length} đơn hàng · Tổng doanh thu ${fmt(total)}`;
    chart.style.setProperty('--chart-count', String(report.buckets.length));
    chart.replaceChildren();
    const max = Math.max(1, ...report.buckets.map(bucket => bucket.total));
    report.buckets.forEach(bucket => {
      const column = document.createElement('div'); column.className = 'sales-chart-day';
      const value = document.createElement('span'); value.className = 'sales-chart-value'; value.textContent = bucket.total ? fmt(bucket.total) : '0';
      const bar = document.createElement('span'); bar.className = 'sales-chart-bar'; bar.style.height = `${Math.max(3, bucket.total / max * 112)}px`;
      const label = document.createElement('span'); label.className = 'sales-chart-label'; label.textContent = bucket.label;
      column.title = `${bucket.label}: ${fmt(bucket.total)}`;
      column.append(value, bar, label); chart.append(column);
    });
  }

  function csvCell(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    let text = String(value ?? '');
    if (/^[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportRevenueReport() {
    const report = getPeriodData();
    if (!periodValue?.value) {
      window.alert('Vui lòng chọn ngày, tháng hoặc năm trước khi xuất báo cáo.');
      return;
    }
    const rows = [
      ['Mã đơn hàng', 'Thời gian đặt', 'Khách hàng', 'Số điện thoại', 'Số lượng sản phẩm', 'Trạng thái', 'Doanh thu'],
      ...report.orders.map(order => [
        order.id,
        order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '',
        order.recipientName,
        order.phone,
        (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        'Giao hàng thành công',
        Number(order.total) || 0
      ])
    ];
    const csv = 'sep=;\r\n' + rows.map(row => row.map(csvCell).join(';')).join('\r\n');
    // Excel detects UTF-16LE reliably on direct open, including Vietnamese diacritics.
    const bytes = new Uint8Array(2 + csv.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let index = 0; index < csv.length; index++) {
      const code = csv.charCodeAt(index);
      bytes[2 + index * 2] = code & 0xff;
      bytes[3 + index * 2] = code >> 8;
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: 'text/csv;charset=utf-16le' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-doanh-thu-${report.mode}-${periodValue.value}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function loadOrderMetrics() {
    try { allOrders = await window.Identify.request('/orders/manage', { headers: { Authorization: `Bearer ${window.Identify.getToken()}` } }); }
    catch { allOrders = []; }
    if (exportButton) exportButton.disabled = false;
    show('dash-orders', String(allOrders.filter(order => ['DELIVERED', 'PICKED_UP'].includes(order.status)).length));
    renderRevenueReport();
  }
  periodSelect?.addEventListener('change', () => { periodValue.value = ''; updatePeriodInput(); renderRevenueReport(); });
  periodValue?.addEventListener('change', renderRevenueReport);
  exportButton?.addEventListener('click', exportRevenueReport);
  updatePeriodInput();
  loadOrderMetrics();

  const tabs = [...document.querySelectorAll('.workspace-nav [data-workspace-tab]')];
  const panels = [...document.querySelectorAll('[data-tab-panel]')];
  const tabLabels = new Map(tabs.map(tab => [tab.dataset.workspaceTab, tab.querySelector('span')?.textContent.trim() || 'Tổng quan']));
  const topbarLabel = document.querySelector('.topbar span b');
  const medicineTitle = document.querySelector('#medicine-manager .medicine-head h2');
  const medicineDescription = document.querySelector('#medicine-manager .medicine-head p');
  const defaultMedicineTitle = medicineTitle?.textContent || 'Quản lý thuốc';
  const defaultMedicineDescription = medicineDescription?.textContent || '';

  function activateTab(tabName, updateAddress = true) {
    const activeName = tabs.some(tab => tab.dataset.workspaceTab === tabName) ? tabName : 'medicines';
    document.body.classList.toggle('consultation-tab-active', activeName === 'consult');
    tabs.forEach(tab => {
      const active = tab.dataset.workspaceTab === activeName;
      tab.classList.toggle('active', active);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = !panel.dataset.tabPanel.split(/\s+/).includes(activeName);
      panel.setAttribute('role', 'tabpanel');
    });
    if (topbarLabel) topbarLabel.textContent = tabLabels.get(activeName) || 'Tổng quan';
    if (activeName === 'inventory') {
      if (medicineTitle) medicineTitle.textContent = 'Quản lý kho';
      if (medicineDescription) medicineDescription.textContent = 'Theo dõi số lượng tồn kho, thuốc sắp hết và hạn sử dụng.';
    } else {
      if (medicineTitle) medicineTitle.textContent = defaultMedicineTitle;
      if (medicineDescription) medicineDescription.textContent = defaultMedicineDescription;
    }
    if (updateAddress && location.hash !== `#tab-${activeName}`)
      history.replaceState(null, '', `#tab-${activeName}`);
  }

  document.querySelectorAll('a[href^="#tab-"]').forEach(link => link.addEventListener('click', event => {
    const tabName = link.getAttribute('href').slice(5);
    if (!tabs.some(tab => tab.dataset.workspaceTab === tabName)) return;
    event.preventDefault();
    activateTab(tabName);
  }));
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#tab-')) activateTab(location.hash.slice(5), false);
  });
  activateTab(location.hash.startsWith('#tab-') ? location.hash.slice(5) : 'medicines', false);
})();
