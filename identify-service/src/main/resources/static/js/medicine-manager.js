(() => {
    const api = window.Identify, token = api.getToken(), list = document.getElementById('medicine-list'),
        msg = document.getElementById('medicine-message'), dialog = document.getElementById('medicine-dialog'),
        form = document.getElementById('medicine-form');
    const headers = {Authorization: `Bearer ${token}`};
    const fields = {
        name: 'medicine-name',
        ingredient: 'medicine-ingredient',
        category: 'medicine-category',
        expiryDate: 'medicine-expiry',
        price: 'medicine-price',
        stock: 'medicine-stock',
        functionText: 'medicine-function',
        recommendation: 'medicine-advice'
    };
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

    function statusDot(alert, label) {
        return `<span class="medicine-status ${alert ? 'is-alert' : 'is-ok'}"><i aria-hidden="true"></i>${label}</span>`
    }

    async function load() {
        try {
            const rows = await api.request('/medicines', {headers});
            if (!rows.length) {
                list.innerHTML = '<p>Chưa có thuốc. Bấm Thêm thuốc để bắt đầu.</p>';
                return
            }
            list.innerHTML = '<div class="medicine-table-wrap"><table class="medicine-table"><thead><tr><th>ẢNH</th><th>TÊN THUỐC</th><th>HOẠT CHẤT</th><th>HẠN DÙNG</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>THAO TÁC</th></tr></thead><tbody>' + rows.map(m => `<tr><td><img class="admin-medicine-thumb" src="${m.imageData || 'assets/images/medicine-placeholder.svg'}" alt="Ảnh ${esc(m.name)}"></td><td><strong>${esc(m.name)}</strong><br>${esc(m.category)}</td><td>${esc(m.ingredient) || '—'}</td><td>${esc(m.expiryDate)}<br>${statusDot(new Date(`${m.expiryDate}T00:00:00`) <= new Date(Date.now() + 90 * 86400000), new Date(`${m.expiryDate}T00:00:00`) < new Date() ? "Đã hết hạn" : new Date(`${m.expiryDate}T00:00:00`) <= new Date(Date.now() + 90 * 86400000) ? "Sắp hết hạn" : "Còn hạn")}</td><td><strong>${new Intl.NumberFormat("vi-VN").format(Number(m.price)||0)}</strong></td><td>${m.stock ?? 0}<br>${statusDot((m.stock ?? 0) <= 5, (m.stock ?? 0) <= 0 ? "Hết hàng" : (m.stock ?? 0) <= 5 ? "Sắp hết" : "Đủ hàng")}</td><td><button data-info="${esc(m.id)}">Thông tin</button> <button data-edit="${esc(m.id)}">Sửa</button> <button data-del="${esc(m.id)}">Xóa</button></td></tr>`).join('') + '</tbody></table></div>';
            rows.forEach(m => {
                list.querySelector(`[data-info="${m.id}"]`).onclick = () => detail(m);
                list.querySelector(`[data-edit="${m.id}"]`).onclick = () => open(m);
                list.querySelector(`[data-del="${m.id}"]`).onclick = () => remove(m)
            })
        } catch (e) {
            msg.textContent = 'Không tải được thuốc: ' + e.message
        }
    }

    function detail(m) {
        let box = list.querySelector('.admin-medicine-detail');
        if (!box) {
            box = document.createElement('section');
            box.className = 'admin-medicine-detail';
            list.append(box)
        }
        box.innerHTML = `<img src="${m.imageData || 'assets/images/medicine-placeholder.svg'}" alt="Ảnh ${esc(m.name)}"><div><span class="overline">CHI TIẾT THUỐC</span><h3>${esc(m.name)}</h3><p><b>Hoạt chất:</b> ${esc(m.ingredient) || 'Chưa cập nhật'}<br><b>Danh mục:</b> ${esc(m.category) || 'Chưa phân loại'}<br><b>Hạn sử dụng:</b> ${esc(m.expiryDate)}</p><p><b>Công dụng</b><br>${esc(m.functionText)}</p><p><b>Khuyến nghị</b><br>${esc(m.recommendation) || 'Chưa cập nhật'}</p></div>`;
        box.scrollIntoView({behavior: 'smooth', block: 'nearest'})
    }

    function open(m) {
        form.reset();
        document.getElementById('medicine-id').value = m?.id || '';
        document.getElementById('medicine-dialog-title').textContent = m ? 'Sửa thuốc' : 'Thêm thuốc mới';
        Object.entries(fields).forEach(([k, v]) => document.getElementById(v).value = m?.[k] || '');
        const img = document.getElementById('medicine-image-preview');
        img.src = m?.imageData || '';
        img.hidden = !m?.imageData;
        dialog.showModal()
    }

    document.getElementById('medicine-add').onclick = () => open(null);
    document.getElementById('medicine-close').onclick = () => dialog.close();
    document.getElementById('medicine-cancel').onclick = () => dialog.close();
    document.getElementById('medicine-image-file').onchange = e => {
        const f = e.target.files[0], img = document.getElementById('medicine-image-preview');
        if (!f) {
            img.hidden = true;
            return
        }
        if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 2 * 1024 * 1024) {
            msg.textContent = 'Chọn JPG, PNG hoặc WebP tối đa 2 MB.';
            e.target.value = '';
            return
        }
        const reader = new FileReader();
        reader.onload = () => {
            img.src = reader.result;
            img.hidden = false
        };
        reader.readAsDataURL(f)
    };
    form.onsubmit = async e => {
        e.preventDefault();
        const id = document.getElementById('medicine-id').value, data = {};
        Object.entries(fields).forEach(([k, v]) => data[k] = document.getElementById(v).value.trim());
        try {
            const previous = id ? await api.request(`/medicines/${id}`, {headers}) : null;
            const file = document.getElementById('medicine-image-file').files[0];
            data.imageData = file ? document.getElementById('medicine-image-preview').src : (previous?.imageData || null);
            await api.request(id ? `/medicines/${id}` : '/medicines', {
                method: id ? 'PUT' : 'POST',
                headers: {...headers, 'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            dialog.close();
            msg.textContent = id ? 'Đã cập nhật thuốc.' : 'Đã thêm thuốc.';
            load()
        } catch (err) {
            msg.textContent = 'Không lưu được thuốc: ' + err.message
        }
    };

    async function remove(m) {
        if (!confirm(`Xóa thuốc ${m.name}?`)) return;
        try {
            await api.request(`/medicines/${m.id}`, {method: 'DELETE', headers});
            load()
        } catch (e) {
            msg.textContent = e.message
        }
    }

    load();
})();



