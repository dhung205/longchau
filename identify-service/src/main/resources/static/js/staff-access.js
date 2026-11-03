(() => {
  const api = window.Identify;
  const token = api.getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const permissionChoices = [
    ['MEDICINE_READ', 'Xem thuốc', 'Xem danh sách và hồ sơ thuốc'],
    ['MEDICINE_CREATE', 'Thêm thuốc', 'Tạo thuốc và cập nhật ảnh'],
    ['MEDICINE_UPDATE', 'Sửa thuốc', 'Sửa giá, tồn kho và thông tin thuốc'],
    ['MEDICINE_DELETE', 'Xóa thuốc', 'Xóa thuốc khỏi danh mục'],
    ['STAFF_READ', 'Xem nhân viên', 'Xem danh sách tài khoản nhân viên'],
    ['STAFF_CREATE', 'Thêm nhân viên', 'Tạo tài khoản STAFF mới'],
    ['STAFF_UPDATE', 'Sửa nhân viên', 'Cập nhật hồ sơ hoặc mật khẩu nhân viên'],
    ['STAFF_DELETE', 'Xóa nhân viên', 'Xóa tài khoản có vai trò STAFF']
  ];
  const permissionBox = document.getElementById('staff-permissions');
  const permissionStatus = document.getElementById('staff-permission-status');
  const message = document.getElementById('staff-message');
  const form = document.getElementById('staff-form');
  const list = document.getElementById('staff-list');
  const idInput = document.getElementById('staff-id');
  const usernameInput = document.getElementById('staff-username');
  const passwordInput = document.getElementById('staff-password');
  const firstNameInput = document.getElementById('staff-first-name');
  const lastNameInput = document.getElementById('staff-last-name');
  const dobInput = document.getElementById('staff-dob');
  const submit = document.getElementById('staff-submit');
  const cancel = document.getElementById('staff-cancel');
  let staffRole;

  const request = (path, options = {}) => api.request(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });

  function renderPermissions(selected = []) {
    permissionBox.replaceChildren();
    permissionChoices.forEach(([key, title, description]) => {
      const label = document.createElement('label');
      label.className = 'staff-permission-option';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.name = 'permission'; input.value = key; input.checked = selected.includes(key);
      const text = document.createElement('span');
      const strong = document.createElement('b'); strong.textContent = title;
      const small = document.createElement('small'); small.textContent = description;
      text.append(strong, small); label.append(input, text); permissionBox.append(label);
    });
  }

  async function loadRole() {
    const response = await request('/roles');
    staffRole = (response.result || []).find(role => role.name === 'STAFF');
    if (!staffRole) throw new Error('Chưa có vai trò STAFF. Hãy khởi động lại ứng dụng.');
    renderPermissions((staffRole.permissions || []).map(permission => permission.name));
  }

  async function loadStaff() {
    try {
      const response = await request('/admin/staff');
      const users = response.result || [];
      list.replaceChildren();
      if (!users.length) { list.innerHTML = '<p class="staff-empty">Chưa có tài khoản nhân viên.</p>'; return; }
      const table = document.createElement('table'); table.className = 'staff-table';
      const head = document.createElement('thead'); head.innerHTML = '<tr><th>TÀI KHOẢN</th><th>HỌ TÊN</th><th>NGÀY SINH</th><th>THAO TÁC</th></tr>';
      const body = document.createElement('tbody');
      users.forEach(user => {
        const row = document.createElement('tr');
        const username = document.createElement('td'); username.textContent = user.username || '—';
        const name = document.createElement('td'); name.textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
        const dob = document.createElement('td'); dob.textContent = user.dob || '—';
        const actions = document.createElement('td'); actions.className = 'staff-row-actions';
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Sửa'; edit.onclick = () => startEdit(user);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'staff-delete'; remove.textContent = 'Xóa'; remove.onclick = () => deleteStaff(user);
        actions.append(edit, remove); row.append(username, name, dob, actions); body.append(row);
      });
      table.append(head, body); list.append(table);
    } catch (error) { message.textContent = `Không tải được nhân viên: ${error.message}`; }
  }

  function resetForm() {
    form.reset(); idInput.value = ''; usernameInput.disabled = false; passwordInput.required = true;
    document.getElementById('staff-password-label').firstChild.textContent = 'Mật khẩu';
    submit.textContent = 'Thêm nhân viên'; cancel.hidden = true;
  }

  function startEdit(user) {
    idInput.value = user.id; usernameInput.value = user.username || ''; usernameInput.disabled = true;
    passwordInput.value = ''; passwordInput.required = false;
    document.getElementById('staff-password-label').firstChild.textContent = 'Mật khẩu mới (để trống nếu giữ nguyên)';
    firstNameInput.value = user.firstName || ''; lastNameInput.value = user.lastName || ''; dobInput.value = user.dob || '';
    submit.textContent = 'Lưu thay đổi'; cancel.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function deleteStaff(user) {
    if (!confirm(`Xóa tài khoản nhân viên “${user.username}”?`)) return;
    try { await request(`/admin/staff/${encodeURIComponent(user.id)}`, { method: 'DELETE' }); message.textContent = 'Đã xóa tài khoản nhân viên.'; await loadStaff(); }
    catch (error) { message.textContent = `Không xóa được: ${error.message}`; }
  }

  document.getElementById('staff-permission-form').addEventListener('submit', async event => {
    event.preventDefault();
    const permissions = [...permissionBox.querySelectorAll('input:checked')].map(input => input.value);
    try {
      const result = await request('/roles/STAFF', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'STAFF', description: 'Nhân viên', permissions }) });
      staffRole = result.result; permissionStatus.textContent = 'Đã lưu quyền. Nhân viên cần đăng nhập lại để nhận quyền mới.';
    } catch (error) { permissionStatus.textContent = `Không lưu được quyền: ${error.message}`; }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = idInput.value;
    const body = { username: usernameInput.value.trim(), password: passwordInput.value, firstName: firstNameInput.value.trim(), lastName: lastNameInput.value.trim(), dob: dobInput.value || null };
    try {
      await request(id ? `/admin/staff/${encodeURIComponent(id)}` : '/admin/staff', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      message.textContent = id ? 'Đã cập nhật nhân viên.' : 'Đã tạo tài khoản nhân viên.'; resetForm(); await loadStaff();
    } catch (error) { message.textContent = `Không lưu được: ${error.message}`; }
  });
  cancel.addEventListener('click', resetForm);
  resetForm();
  Promise.all([loadRole(), loadStaff()]).catch(error => { permissionStatus.textContent = `Không tải được cấu hình quyền: ${error.message}`; });
})();
