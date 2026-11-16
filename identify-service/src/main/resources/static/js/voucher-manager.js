(async () => {
    if (!document.getElementById('voucher-manager')) return;
    const api = window.Identify, token = api.getToken();
    if (!token) {
        api.goLogin();
        return;
    }
    const headers = {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'};
    const notice = document.getElementById('notice'), list = document.getElementById('voucher-list'),
        dialog = document.getElementById('editor'), form = document.getElementById('voucher-form'),
        error = document.getElementById('form-notice'), save = document.getElementById('save');
    let rows = [], editing = null;
    const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ',
        date = v => v ? new Date(v).toLocaleString('vi-VN') : 'Không giới hạn';
    try {
        const info = await api.request('/users/myInfo', {headers});
        if (!(info.result?.roles || []).some(r => r.name === 'ADMIN')) {
            notice.textContent = 'Chỉ quản trị viên được quản lý voucher.';
            document.getElementById('new-voucher').disabled = true;
            return;
        }
    } catch (e) {
        notice.textContent = e.message;
        return;
    }

    function open(v) {
        editing = v;
        form.reset();
        error.textContent = '';
        form.elements.code.disabled = !!v;
        document.getElementById('editor-title').textContent = v ? 'Sửa voucher' : 'Tạo voucher';
        if (v) for (const key of ['code', 'title', 'minimumSubtotal', 'percent', 'amount', 'maximumDiscount', 'startsAt', 'expiresAt', 'usageLimit']) form.elements[key].value = v[key] ?? '';
        form.elements.active.checked = v ? v.active : true;
        dialog.showModal();
    }

    const search = document.getElementById('voucher-search');
    const filter = document.getElementById('voucher-filter');
    function state(v) {
        if (!v.active) return ['disabled', 'Đã tắt'];
        const now = Date.now();
        if (v.expiresAt && new Date(v.expiresAt).getTime() <= now) return ['expired', 'Đã hết hạn'];
        if (v.startsAt && new Date(v.startsAt).getTime() > now) return ['upcoming', 'Sắp diễn ra'];
        if (v.usageLimit != null && v.usedCount >= v.usageLimit) return ['exhausted', 'Hết lượt'];
        return ['available', 'Đang áp dụng'];
    }
    function render() {
            list.replaceChildren();
            const query = search.value.trim().toLocaleLowerCase('vi');
            const visible = rows.filter(v => (filter.value === 'all' || state(v)[0] === filter.value) && (v.code + ' ' + v.title).toLocaleLowerCase('vi').includes(query));
            if (!visible.length) { const empty = document.createElement('p'); empty.className = 'voucher-empty'; empty.textContent = rows.length ? 'Không có voucher phù hợp. Thử thay đổi từ khóa hoặc bộ lọc.' : 'Chưa có voucher. Bấm Tạo voucher để thêm chương trình đầu tiên.'; list.append(empty); }
            for (const v of visible) {
                const card = document.createElement('article');
                card.className = 'voucher';
                const content = document.createElement('div');
                for (const [tag, text] of [['h2', v.title], ['small', v.code + ' · ' + state(v)[1]], ['p', (v.percent > 0 ? 'Giảm ' + v.percent + '%' : 'Giảm ' + money(v.amount)) + ' · Đơn từ ' + money(v.minimumSubtotal) + (v.maximumDiscount ? ' · Tối đa ' + money(v.maximumDiscount) : '')], ['p', 'Từ: ' + date(v.startsAt) + ' · Đến: ' + date(v.expiresAt)], ['p', 'Đã dùng ' + v.usedCount + ' / ' + (v.usageLimit ?? 'không giới hạn') + ' lượt']]) {
                    const el = document.createElement(tag);
                    el.textContent = text;
                    if (tag === 'small') el.className = 'voucher-status ' + state(v)[0];
                    content.append(el);
                }
                const actions = document.createElement('div');
                actions.className = 'actions';
                const edit = document.createElement('button');
                edit.textContent = 'Chỉnh sửa';
                edit.onclick = () => open(v);
                const toggle = document.createElement('button');
                toggle.className = 'voucher-secondary';
                toggle.textContent = v.active ? 'Tắt voucher' : 'Bật voucher';
                toggle.onclick = async () => {
                    toggle.disabled = true;
                    try {
                        await api.request('/vouchers/manage/' + encodeURIComponent(v.code), {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify({...v, active: !v.active})
                        });
                        await load();
                    } catch (e) {
                        notice.textContent = e.message;
                        toggle.disabled = false;
                    }
                };
                actions.append(edit, toggle);
                card.append(content, actions);
                list.append(card);
            }
            notice.textContent = visible.length + ' / ' + rows.length + ' voucher';
    }
    async function load() {
        notice.textContent = 'Đang tải voucher…';
        try { rows = await api.request('/vouchers/manage', {headers}); render(); }
        catch (e) { notice.textContent = e.message; }
    }
    search.addEventListener('input', render);
    filter.addEventListener('change', render);

    form.onsubmit = async event => {
        event.preventDefault();
        const body = {};
        for (const key of ['code', 'title', 'minimumSubtotal', 'percent', 'amount', 'maximumDiscount', 'startsAt', 'expiresAt', 'usageLimit']) {
            const value = form.elements[key].value;
            body[key] = ['code', 'title'].includes(key) ? value.trim() : ['startsAt', 'expiresAt'].includes(key) ? (value || null) : (value === '' ? null : Number(value));
        }
        body.active = form.elements.active.checked;
        save.disabled = true;
        error.textContent = '';
        try {
            await api.request('/vouchers/manage' + (editing ? '/' + encodeURIComponent(editing.code) : ''), {
                method: editing ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(body)
            });
            dialog.close();
            await load();
        } catch (e) {
            error.textContent = e.message;
        } finally {
            save.disabled = false;
        }
    };
    document.getElementById('voucher-refresh').onclick = async event => { const button = event.currentTarget; button.disabled = true; try { await load(); } finally { button.disabled = false; } };
    document.getElementById('new-voucher').onclick = () => open(null);
    document.getElementById('cancel').onclick = () => dialog.close();
    await load();
})();