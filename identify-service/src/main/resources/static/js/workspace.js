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
