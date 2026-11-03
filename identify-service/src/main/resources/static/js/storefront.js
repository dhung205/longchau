(() => {
  const {getToken, goLogin, clearToken, request, decodeToken} = window.Identify;
  const token = getToken();
  const cartKey = 'identify.shopCart';
  let userCanShop = false;
  let catalog = [];
  if (!token) localStorage.removeItem(cartKey);

  let username = 'Tài khoản';
  try { username = decodeToken(token).sub || username; } catch {}
  const label = document.getElementById('accountLabel');
  label.textContent = token ? username : 'Đăng nhập';
  if (token) request('/users/myInfo', {headers: {Authorization: `Bearer ${token}`}}).then(body => {
    const user = body.result || {};
    label.textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || username;
    const roles = (user.roles || []).map(role => role.name);
    userCanShop = roles.includes('USER');
    if (!userCanShop) localStorage.removeItem(cartKey);
    updateCartCount();
    renderCatalog();
    const destination = roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : null;
    if (destination) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'workspaceLink';
      button.textContent = destination === 'admin.html' ? 'Trang quản trị' : 'Trang nhân viên';
      button.addEventListener('click', () => {
        window.location.assign(`${window.Identify.API_BASE}/${destination}`);
      });
      const dropdown = document.getElementById('accountDropdown');
      dropdown.prepend(button);
    }
  }).catch(() => { localStorage.removeItem(cartKey); updateCartCount(); });
  document.getElementById('accountLink').addEventListener('click', event => {
    if (!token) return;
    event.preventDefault();
    const dropdown = document.getElementById('accountDropdown');
    dropdown.hidden = !dropdown.hidden;
  });
  document.getElementById('headerLogout').addEventListener('click', async () => {
    try { await request('/auth/logout', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}); } catch {}
    localStorage.removeItem(cartKey);
    clearToken(); goLogin();
  });
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("searchInput");
  const initialSearch = new URLSearchParams(window.location.search).get("q");
  if (initialSearch) search.value = initialSearch;
  const detailDialog = document.createElement("dialog");
  detailDialog.className = "catalog-detail-dialog";
  detailDialog.innerHTML = '<button type="button" class="catalog-detail-close" aria-label="Đóng">×</button><div class="catalog-detail-content"></div>';
  document.body.append(detailDialog);
  detailDialog.querySelector("button").onclick = () => detailDialog.close();
  const money = value => new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "";
  const readCart = () => { try { return JSON.parse(localStorage.getItem(cartKey) || "[]"); } catch { return []; } };
  function updateCartCount() {
    const count = document.getElementById("cartCount");
    if (count) {
      const quantity = readCart().reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
      count.textContent = userCanShop ? quantity : '';
      count.hidden = !userCanShop || quantity === 0;
    }
  }
  window.addEventListener('storage', event => { if (event.key === cartKey) updateCartCount(); });
  let activeCategory = "";
  function showDetail(m) {
    const content = detailDialog.querySelector(".catalog-detail-content");
    const safe = value => String(value || "Chưa cập nhật").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
    content.innerHTML = `<span class="eyebrow">THÔNG TIN SẢN PHẨM</span><h2>${safe(m.name)}</h2>${m.imageData?`<img class="catalog-detail-image" src="${m.imageData}" alt="${safe(m.name)}">`:""}<p><b>Hoạt chất:</b> ${safe(m.ingredient)}</p><p><b>Danh mục:</b> ${safe(m.category)}</p><p><b>Hạn sử dụng:</b> ${safe(m.expiryDate)}</p><hr><h3>Công dụng</h3><p>${safe(m.functionText)}</p><h3>Khuyến nghị / lưu ý</h3><p>${safe(m.recommendation)}</p><small>Thông tin tham khảo. Hãy đọc hướng dẫn trên sản phẩm hoặc hỏi dược sĩ.</small>`;
    detailDialog.showModal();
  }
  function renderCatalog() {
    const query = search.value.trim().toLocaleLowerCase("vi");
    const rows = catalog.filter(m => (!activeCategory || (m.category || "").toLocaleLowerCase("vi").includes(activeCategory.toLocaleLowerCase("vi"))) && (!query || [m.name,m.ingredient,m.category].join(" ").toLocaleLowerCase("vi").includes(query)));
    grid.replaceChildren();
    if (!rows.length) {grid.textContent = catalog.length ? "Không tìm thấy thuốc phù hợp." : "Chưa có thuốc trong danh mục.";return;}
    rows.forEach(m => {
      const card=document.createElement("article");card.className="catalog-medicine-card";
      const title=document.createElement("h3");title.textContent=m.name;
      const type=document.createElement("span");type.className="product-type";type.textContent=m.category||"Thuốc";
      const image=document.createElement("img");image.className="catalog-medicine-image";image.alt=m.name;image.src=m.imageData||"assets/images/medicine-placeholder.svg";const ingredient=document.createElement("p");ingredient.textContent=m.ingredient||"";
      const expiry=document.createElement("small");expiry.textContent=`Hạn dùng: ${m.expiryDate}`;
      const price=document.createElement("strong");price.className="catalog-price";price.textContent=money(m.price);
      const stock=Number(m.stock)||0;const availability=document.createElement("small");availability.className="catalog-stock";availability.textContent=stock>0?`Còn ${stock} sản phẩm`:"Tạm hết hàng";
      const quantity=document.createElement("input");quantity.type="number";quantity.className="catalog-quantity";quantity.min="1";quantity.max=String(stock);quantity.value="1";quantity.disabled=stock<1;quantity.hidden=!userCanShop;quantity.setAttribute("aria-label",`Số lượng ${m.name}`);
      const add=document.createElement("button");add.type="button";add.className="catalog-add-button";add.textContent=stock<1?"Hết hàng":userCanShop?"Thêm vào giỏ":"Đăng nhập để mua";add.disabled=stock<1;
      add.onclick=()=>{if(!userCanShop){goLogin();return;}const amount=Math.min(stock,Math.max(1,Number(quantity.value)||1));quantity.value=String(amount);const cart=readCart();const line=cart.find(item=>String(item.id)===String(m.id));if(line)line.quantity=Math.min(stock,(Number(line.quantity)||0)+amount);else cart.push({id:m.id,name:m.name,price:Number(m.price)||0,quantity:amount,imageData:m.imageData||"",selected:true});localStorage.setItem(cartKey,JSON.stringify(cart));updateCartCount();add.textContent="Đã thêm ✓";setTimeout(()=>{add.textContent="Thêm vào giỏ"},1000);};
      const actions=document.createElement("div");actions.className="catalog-actions";const detail=document.createElement("button");detail.type="button";detail.className="catalog-detail-button";detail.textContent="Xem chi tiết";detail.onclick=()=>{window.location.href=`product.html?id=${encodeURIComponent(m.id)}`};actions.append(detail,add);
      const buyControls=document.createElement("div");buyControls.className="catalog-buy-controls"+(userCanShop?"":" catalog-login-required");buyControls.append(quantity,actions);
      card.append(image,title,type,ingredient,expiry,price,availability,buyControls);grid.append(card);
    });
  }
  async function loadCatalog() {
    try { catalog=await window.Identify.request("/catalog/medicines"); renderCatalog(); }
    catch { grid.textContent="Chưa tải được danh sách thuốc. Vui lòng thử tải lại trang."; }
  }
  search.addEventListener("input",renderCatalog);
  document.getElementById("searchButton").addEventListener("click",()=>{renderCatalog();document.getElementById("products").scrollIntoView({behavior:"smooth"});});
  search.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();renderCatalog();document.getElementById("products").scrollIntoView({behavior:"smooth"});}});
  document.querySelectorAll("[data-category]").forEach(el=>el.addEventListener("click",()=>{activeCategory=el.dataset.category||"";renderCatalog();document.getElementById("products").scrollIntoView({behavior:"smooth"});}));
  document.querySelectorAll("[data-search]").forEach(el=>el.addEventListener("click",()=>{search.value=el.dataset.search;renderCatalog();}));
  document.querySelector('[data-nav="orders"]')?.addEventListener('click', () => { window.location.href = 'orders.html'; });
  document.querySelector('[data-nav="personal"]')?.addEventListener('click', async () => {
    const dialog = document.getElementById('personalInfoDialog');
    document.getElementById('accountDropdown').hidden = true;
    if (!getToken()) { goLogin(); return; }
    dialog.showModal();
    const token = getToken();
    try {
      const body = await request('/users/myInfo', {headers: {Authorization: `Bearer ${token}`}});
      const user = body.result || {};
      document.getElementById('personalInfoName').textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Chưa cập nhật';
      document.getElementById('personalInfoUsername').textContent = user.username || 'Chưa cập nhật';
      document.getElementById('personalInfoEmail').textContent = user.email || 'Chưa cập nhật';
      document.getElementById('personalInfoPhone').textContent = user.phone || 'Chưa cập nhật';
      document.getElementById('personalInfoDob').textContent = user.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
      document.getElementById('personalInfoAddress').textContent = user.address || 'Chưa có địa chỉ nhận hàng. Địa chỉ sẽ được lưu sau đơn giao hàng đầu tiên.';
      document.getElementById('personalInfoNote').textContent = user.address
        ? 'Địa chỉ nhận hàng gần nhất được lưu từ đơn giao hàng của bạn.'
        : 'Địa chỉ và số điện thoại sẽ được lưu khi bạn đặt đơn giao hàng.';
    } catch (error) {
      document.getElementById('personalInfoName').textContent = 'Không tải được thông tin';
      document.getElementById('personalInfoNote').textContent = error.message;
    }
  });
  updateCartCount();
  loadCatalog();  document.getElementById('cartButton').onclick = () => { if (!userCanShop) { goLogin(); return; } window.location.href = 'cart.html'; };
  const panel = document.getElementById('consultPanel');
  document.getElementById('consultToggle').addEventListener('click', () => {panel.hidden = !panel.hidden;});
  document.getElementById('consultClose').addEventListener('click', () => {panel.hidden = true;});
  document.getElementById('consultForm').addEventListener('submit', event => {event.preventDefault(); document.getElementById('consultMessages').textContent = 'Vui lòng gọi 1800 6928 để được tư vấn.';});
})();
