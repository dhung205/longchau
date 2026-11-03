(() => {
 const grid=document.getElementById('productGrid');
 const cartKey='identify.shopCart';
 const money=value=>new Intl.NumberFormat('vi-VN').format(value||0)+'';
 let cart=JSON.parse(localStorage.getItem(cartKey)||'[]');
 const count=document.getElementById('cartCount');
 const sync=()=>{localStorage.setItem(cartKey,JSON.stringify(cart));count.textContent=cart.reduce((n,x)=>n+x.quantity,0)};
 async function render(){
  try{
   const items=await window.Identify.request('/catalog/medicines');grid.replaceChildren();
   if(!items.length){grid.textContent='Chưa có thuốc trong danh mục.';return}
   items.forEach(m=>{
    const card=document.createElement('article');card.className='catalog-medicine-card';
    const image=document.createElement('img');image.className='catalog-medicine-image';image.alt=m.name;image.src=m.imageData||'assets/images/medicine-placeholder.svg';
    const name=document.createElement('h3');name.textContent=m.name;
    const category=document.createElement('span');category.className='product-type';category.textContent=m.category||'Thuốc';
    const price=document.createElement('strong');price.className='catalog-price';price.textContent=money(m.price);const availability=document.createElement('small');availability.className='catalog-stock';availability.textContent=(m.stock??0)>0?'Còn '+m.stock+' sản phẩm':'Tạm hết hàng';
    const qty=document.createElement('input');qty.type='number';qty.min='1';qty.max=String(m.stock??0);qty.value='1';qty.disabled=(m.stock??0)<=0;qty.className='catalog-quantity';qty.setAttribute('aria-label','Số lượng mua');const buy=document.createElement('button');buy.type='button';buy.textContent=(m.stock??0)>0?'Thêm vào giỏ':'Hết hàng';buy.disabled=(m.stock??0)<=0;buy.onclick=()=>{const amount=Math.max(1,Number(qty.value)||1);const line=cart.find(x=>x.id===m.id);if(line)line.quantity+=amount;else cart.push({id:m.id,name:m.name,price:m.price||0,quantity:amount,imageData:m.imageData||''});sync();buy.textContent='Đã thêm ✓';setTimeout(()=>buy.textContent='Thêm vào giỏ',900)};
    const controls=document.createElement("div");controls.className="catalog-buy-controls";controls.append(qty,buy);card.append(image,name,category,price,availability,controls);grid.append(card);
   });
  }catch{grid.textContent='Chưa tải được danh sách thuốc.'}
 }
 sync();document.getElementById('cartButton').onclick=()=>location.href='cart.html';render();
})();
