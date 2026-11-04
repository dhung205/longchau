(async () => {
  const {getToken,request,API_BASE,clearToken,goLogin} = window.Identify;
  const token = getToken();
  if (!token) {goLogin(); return;}
  try {
    const body = await request('/users/myInfo',{headers:{Authorization:`Bearer ${token}`}});
    const user = body.result;
    const roles = (user.roles || []).map(role => role.name);
    const expected = document.body.dataset.role;
    if (!roles.includes(expected)) {
      const page = roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : 'home.html';
      location.replace(`${API_BASE}/${page}`); return;
    }
    const displayName = [user.firstName,user.lastName].filter(Boolean).join(' ') || user.username;
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.textContent = `Xin chào, ${displayName}`;
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.textContent = displayName;
    const profileValues = {
      'staff-profile-name': displayName,
      'staff-profile-username': user.username || 'Chưa cập nhật',
      'staff-profile-email': user.email || 'Chưa cập nhật',
      'staff-profile-dob': user.dob ? new Date(`${user.dob}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
    };
    Object.entries(profileValues).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.textContent = value;
    });
    const profileAvatar = document.getElementById('staff-profile-avatar');
    if (profileAvatar) profileAvatar.textContent = displayName.split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
    if (expected === 'STAFF' && document.getElementById('staff-directory-list')) {
      const directoryMessage = document.getElementById('staff-directory-message');
      const directoryList = document.getElementById('staff-directory-list');
      try {
        const response = await request('/admin/staff/directory', {headers:{Authorization:`Bearer ${token}`}});
        const staffMembers = response.result || [];
        document.getElementById('staff-directory-count').textContent = `${staffMembers.length} nhân viên đang hoạt động`;
        directoryMessage.textContent = '';
        directoryList.replaceChildren();
        if (!staffMembers.length) directoryMessage.textContent = 'Chưa có nhân viên đang hoạt động.';
        staffMembers.forEach(member => {
          const card = document.createElement('article');
          card.className = 'staff-directory-card';
          const initials = document.createElement('span');
          initials.className = 'staff-directory-avatar';
          initials.textContent = String(member.fullName || 'NV').split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
          const details = document.createElement('div');
          const name = document.createElement('b');
          name.textContent = member.fullName || 'Chưa cập nhật tên';
          const position = document.createElement('small');
          position.textContent = member.position || 'Nhân viên nhà thuốc';
          const status = document.createElement('span');
          status.className = 'staff-directory-status';
          status.textContent = 'Đang hoạt động';
          details.append(name, position);
          card.append(initials, details, status);
          directoryList.append(card);
        });
      } catch (error) {
        document.getElementById('staff-directory-count').textContent = 'Không tải được danh sách';
        directoryMessage.textContent = error.message;
      }
    }
    document.getElementById('workspace').hidden = false;
    document.getElementById('access-message').hidden = true;
  } catch {
    document.getElementById('access-message').textContent = 'Không thể xác minh quyền. Vui lòng đăng nhập lại.';
    return;
  }
  document.getElementById('logout').addEventListener('click',async () => {
    try {await request('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});} catch {}
    clearToken();goLogin();
  });
})();
