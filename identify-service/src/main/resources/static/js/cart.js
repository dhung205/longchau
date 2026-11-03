(async () => {
    const auth = window.Identify, token = auth.getToken();
    if (!token) {
        auth.goLogin();
        return
    }
    try {
        const body = await auth.request('/users/myInfo', {headers: {Authorization: `Bearer ${token}`}});
        const roles = (body.result?.roles || []).map(r => r.name);
        if (!roles.includes('USER')) {
            location.replace(`${auth.API_BASE}/${roles.includes('ADMIN') ? 'admin.html' : roles.includes('STAFF') ? 'staff.html' : 'home.html'}`);
            return
        }
    } catch {
        auth.clearToken();
        auth.goLogin();
        return
    }
    const key = 'identify.shopCart', lines = document.getElementById('cart-lines'),
        total = document.getElementById('cart-total'), form = document.getElementById('checkout-form'),
        message = document.getElementById('checkout-message');
    let cart = JSON.parse(localStorage.getItem(key) || '[]');
    const money = n => new Intl.NumberFormat('vi-VN').format(n) + '';

    function save() {
        localStorage.setItem(key, JSON.stringify(cart));
        render()
    }

    function render() {
        lines.replaceChildren();
        if (!cart.length) {
            lines.innerHTML = '<div class="cart-empty"><h2>Giỏ hàng đang trống</h2><a href="home.html">Khám phá danh sách thuốc</a></div>';
            form.querySelector('button').disabled = true;
            total.textContent = money(0);
            return
        }
        form.querySelector('button').disabled = false;
        cart.forEach(item => {
            const row = document.createElement('article');
            row.className = 'shop-cart-item';
            const img = document.createElement('img');
            img.src = item.imageData || 'assets/images/medicine-placeholder.svg';
            img.alt = item.name;
            const info = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = item.name;
            const price = document.createElement('p');
            price.textContent = money(item.price);
            const qty = document.createElement('input');
            qty.type = 'number';
            qty.min = '1';
            qty.value = item.quantity;
            qty.setAttribute('aria-label', 'Số lượng');
            qty.onchange = () => {
                item.quantity = Math.max(1, Number(qty.value) || 1);
                save()
            };
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Xóa';
            remove.onclick = () => {
                cart = cart.filter(x => x.id !== item.id);
                save()
            };
            info.append(name, price, qty, remove);
            row.append(img, info);
            lines.append(row)
        });
        total.textContent = money(cart.reduce((n, x) => n + x.price * x.quantity, 0))
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!cart.length) return;
        const data = Object.fromEntries(new FormData(form));
        const order = {
            id: 'LC-' + Date.now(),
            customer: data,
            items: cart,
            total: cart.reduce((n, x) => n + x.price * x.quantity, 0),
            createdAt: new Date().toISOString()
        };
        const orders = JSON.parse(localStorage.getItem('identify.demoOrders') || '[]');
        orders.push(order);
        localStorage.setItem('identify.demoOrders', JSON.stringify(orders));
        cart = [];
        save();
        message.textContent = `Đã ghi nhận đơn ${order.id}. Đây là đặt hàng thử nghiệm, chưa thanh toán thật.`;
        form.reset()
    });
    render();
})();
