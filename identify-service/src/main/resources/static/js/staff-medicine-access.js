(() => {
  const api = window.Identify;
  const panel = document.getElementById('medicine-manager');
  if (!panel) return;
  let roles = [];
  try { roles = String(api.decodeToken(api.getToken()).scope || '').split(/\s+/); } catch {}
  const allowed = permission => roles.includes('ROLE_ADMIN') || roles.includes(permission);
  const anyMedicineAccess = ['MEDICINE_READ','MEDICINE_CREATE','MEDICINE_UPDATE','MEDICINE_DELETE'].some(allowed);
  panel.hidden = !anyMedicineAccess;
  if (!anyMedicineAccess) return;
  const applyControls = () => {
    const add = document.getElementById('medicine-add');
    if (add) add.hidden = !allowed('MEDICINE_CREATE');
    panel.querySelectorAll('[data-info]').forEach(button => button.hidden = !allowed('MEDICINE_READ'));
    panel.querySelectorAll('[data-edit]').forEach(button => button.hidden = !allowed('MEDICINE_UPDATE'));
    panel.querySelectorAll('[data-del]').forEach(button => button.hidden = !allowed('MEDICINE_DELETE'));
  };
  new MutationObserver(applyControls).observe(document.getElementById('medicine-list'), { childList: true, subtree: true });
  applyControls();
})();
