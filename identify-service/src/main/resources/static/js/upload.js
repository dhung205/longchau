(() => {
  const form = document.getElementById('document-upload-form');
  const status = document.getElementById('document-upload-status');
  const fileInput = document.getElementById('document-file');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const {getToken, API_BASE} = window.Identify;
    const token = getToken();
    if (!token) {status.textContent = 'Bạn cần đăng nhập trước khi tải tài liệu.'; return;}
    const file = document.getElementById('document-file').files[0];
    if (!file) return;
    if (!/\.(pdf|docx?|xlsx?|jpe?g|png|gif)$/i.test(file.name) || file.size === 0 || file.size > 20 * 1024 * 1024) {
      status.textContent = 'Chọn file ảnh, PDF, Word hoặc Excel không rỗng và tối đa 20 MB.'; return;
    }
    const button = form.querySelector('button');
    button.disabled = true; status.textContent = 'Đang tải tài liệu…';
    const data = new FormData(); data.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/files`, {method:'POST', headers:{Authorization:`Bearer ${token}`}, body:data});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' : response.status === 413 ? 'File vượt quá dung lượng cho phép.' : result.message || 'Không thể tải file. Kiểm tra định dạng và thử lại.');
      status.textContent = `Đã tải lên: ${result.originalName} (${Math.ceil(result.size / 1024)} KB).`;
      form.reset();
      loadFiles();
    } catch (error) {status.textContent = error.message;} finally {button.disabled = false;}
  });
  const box=document.createElement('section');box.className='document-library';document.getElementById('document-upload-status').after(box);
  const heading=document.createElement('h3');heading.textContent='Danh sách tài liệu';box.append(heading);
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Làm mới danh sách';box.append(refresh);
  const list=document.createElement('div');list.className='document-list';box.append(list);
  const viewer=document.createElement('iframe');viewer.title='Xem tài liệu hoặc ảnh';viewer.style.cssText='width:100%;height:600px;margin-top:16px';viewer.hidden=true;box.append(viewer);
  const close=document.createElement('button');close.textContent='Đóng bản xem';close.hidden=true;box.append(close);
  let activeUrl;
  close.onclick=()=>{viewer.hidden=true;close.hidden=true;viewer.removeAttribute('src');if(activeUrl)URL.revokeObjectURL(activeUrl);};
  async function open(file,preview){
    try{
      const response=await fetch(`${window.Identify.API_BASE}/files/${encodeURIComponent(file.filename)}?preview=${preview}`,{headers:{Authorization:`Bearer ${window.Identify.getToken()}`}});
      if(!response.ok)throw new Error('Không mở được file. Hãy kiểm tra phiên đăng nhập.');
      const url=URL.createObjectURL(await response.blob());
      if(preview){if(activeUrl)URL.revokeObjectURL(activeUrl);activeUrl=url;viewer.src=url;viewer.hidden=false;close.hidden=false;}
      else{const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    }catch(error){status.textContent=error.message;}
  }
  async function loadFiles(){
    list.replaceChildren();
    if(!window.Identify.getToken()){list.textContent='Đăng nhập để xem tài liệu.';return;}
    refresh.disabled=true;
    try{
      const files=await window.Identify.request('/files',{headers:{Authorization:`Bearer ${window.Identify.getToken()}`}});
      if(!files.length)list.textContent='Chưa có tài liệu. File cũ chưa có thông tin người tải chỉ admin xem được.';
      files.forEach(file=>{
        const row=document.createElement('div');row.className='document-row';row.style.cssText='padding:16px 0;display:flex;gap:12px;flex-wrap:wrap;border-bottom:1px solid #ddd';
        const label=document.createElement('span');label.textContent=`${file.name} · ${Math.ceil(file.size/1024)} KB`;label.style.overflowWrap='anywhere';row.append(label);
        if(/\.(pdf|jpe?g|png|gif)$/i.test(file.filename)){const b=document.createElement('button');b.textContent=file.filename.endsWith('.pdf')?'Xem PDF':'Xem ảnh';b.onclick=()=>open(file,true);row.append(b);}
        const download=document.createElement('button');download.textContent='Tải xuống';download.onclick=()=>open(file,false);row.append(download);
        const remove=document.createElement('button');remove.textContent='Xóa';remove.style.color='#c44050';
        remove.onclick=async()=>{
          if(!confirm(`Xóa vĩnh viễn file “${file.name}”?`))return;
          remove.disabled=true;
          try{
            const response=await fetch(`${window.Identify.API_BASE}/files/${encodeURIComponent(file.filename)}`,{method:'DELETE',headers:{Authorization:`Bearer ${window.Identify.getToken()}`}});
            if(!response.ok)throw new Error('Không xóa được file. Hãy kiểm tra quyền và thử lại.');
            close.onclick();status.textContent='Đã xóa file.';await loadFiles();
          }catch(error){status.textContent=error.message;}finally{remove.disabled=false;}
        };row.append(remove);list.append(row);
      });
    }catch{list.textContent='Không tải được danh sách. Hãy đăng nhập lại hoặc làm mới.';}finally{refresh.disabled=false;}
  }
  refresh.onclick=loadFiles;loadFiles();
})();


