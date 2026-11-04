(() => {
  const api = window.Identify;
  const token = api.getToken();
  const status = document.getElementById('consultations-status');
  const list = document.getElementById('consultations-list');
  const userList = document.getElementById('consultations-users');
  const selectedHeader = document.getElementById('consultations-selected');
  const thread = document.getElementById('consultations-thread');
  const replyForm = document.getElementById('consultations-reply-form');
  const replyTarget = document.getElementById('consultations-reply-target');
  const replyTargetWrap = document.getElementById('consultations-reply-target-wrap');
  const replyInput = document.getElementById('consultations-reply-input');
  const refresh = document.getElementById('consultations-refresh');
  if (!token || !status || !list || !userList || !selectedHeader || !thread || !replyForm || !replyInput) return;
  replyInput.placeholder = 'Nhập tin nhắn…';
  const replyButton = replyForm.querySelector('button[type="submit"]');
  if (replyButton) replyButton.textContent = 'Gửi';

  const headers = { Authorization: `Bearer ${token}` };
  let signature = '';
  let busy = false;
  let lastPendingCount = null;
  let noticeTimer = null;
  let selectedUserId = null;
  let selectedPendingId = null;
  let conversations = [];
  const objectUrls = new Set();
  const replySeparator = '\n\n[[LC_CHAT_REPLY]]\n\n';

  function attachTimeOnTap(bubble) {
    let timer;
    bubble.addEventListener('click', event => {
      if (event.target.closest('button, a')) return;
      bubble.classList.add('show-chat-time');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => bubble.classList.remove('show-chat-time'), 3000);
    });
  }

  function parseReply(value) {
    const match = value.match(/^\[\[LC_AT:([^\]]+)\]\]\n([\s\S]*)$/);
    return match ? { text: match[2], time: match[1] } : { text: value, time: '' };
  }

  function keyFor(item) {
    return item.customerId || item.customerUsername || item.customerName || 'unknown-customer';
  }

  function groupByCustomer(rows) {
    const groups = new Map();
    rows.forEach(item => {
      const key = keyFor(item);
      if (!groups.has(key)) groups.set(key, {
        id: key,
        name: item.customerName || 'Khách hàng',
        username: item.customerUsername || '',
        rows: []
      });
      const group = groups.get(key);
      if (!group.username && item.customerUsername) group.username = item.customerUsername;
      group.rows.push(item);
    });
    return [...groups.values()].map(group => {
      group.rows.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      group.pending = group.rows.filter(item => item.status !== 'ANSWERED').length;
      group.latest = group.rows[group.rows.length - 1];
      return group;
    }).sort((a, b) => new Date(b.latest?.createdAt || 0) - new Date(a.latest?.createdAt || 0));
  }

  async function fetchAttachment(item, download = false) {
    const response = await fetch(`${api.API_BASE}${item.attachmentUrl}${download ? '?download=true' : ''}`, { headers });
    if (!response.ok) throw new Error('Không mở được tệp đính kèm.');
    const url = URL.createObjectURL(await response.blob());
    objectUrls.add(url);
    return url;
  }

  function makeAttachment(item) {
    if (!item.attachmentUrl) return null;
    const wrap = document.createElement('div');
    wrap.className = 'consultation-attachment';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'consultation-file-link';
    open.textContent = `📎 ${item.attachmentName || 'Tệp khách hàng gửi'}`;
    open.addEventListener('click', async () => {
      open.disabled = true;
      const preview = window.open('about:blank', '_blank');
      if (preview) preview.opener = null;
      try {
        const url = await fetchAttachment(item);
        if (preview && !preview.closed) preview.location.href = url;
        else {
          const link = document.createElement('a');
          link.href = url;
          link.download = item.attachmentName || 'tep-tu-van';
          link.click();
        }
      } catch (error) {
        preview?.close();
        status.textContent = error.message;
      } finally { open.disabled = false; }
    });
    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'consultation-download';
    download.textContent = 'Tải tệp';
    download.addEventListener('click', async () => {
      download.disabled = true;
      try {
        const url = await fetchAttachment(item, true);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.attachmentName || 'tep-tu-van';
        link.click();
      } catch (error) { status.textContent = error.message; }
      finally { download.disabled = false; }
    });
    wrap.append(open, download);
    return wrap;
  }

  function messageCard(item) {
    const row = document.createElement('article');
    row.className = 'consultation-message-row customer-message';
    const bubble = document.createElement('div');
    bubble.className = 'consultation-question-bubble';
    bubble.textContent = item.question || '';
    attachTimeOnTap(bubble);
    const attachment = makeAttachment(item);
    if (attachment) bubble.append(attachment);
    const meta = document.createElement('small');
    meta.className = 'consultation-message-meta';
    const time = item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '';
    meta.dataset.chatTime = '';
    meta.textContent = time;
    bubble.append(meta);
    row.append(bubble);
    thread.append(row);
    if (item.answer) item.answer.split(replySeparator).forEach(rawAnswer => {
      const answer = parseReply(rawAnswer);
      const answerRow = document.createElement('article');
      answerRow.className = 'consultation-message-row staff-message';
      const answerBubble = document.createElement('div');
      answerBubble.className = 'consultation-answer-bubble';
      const answerText = document.createElement('p');
      answerText.textContent = answer.text;
      attachTimeOnTap(answerBubble);
      const answerTime = document.createElement('small');
      answerTime.dataset.chatTime = '';
      answerTime.textContent = answer.time ? new Date(answer.time).toLocaleString('vi-VN') : '';
      answerBubble.append(answerText, answerTime);
      answerRow.append(answerBubble);
      thread.append(answerRow);
    });
  }

  function renderThread() {
    objectUrls.forEach(URL.revokeObjectURL);
    objectUrls.clear();
    thread.replaceChildren();
    replyForm.hidden = true;
    const selected = conversations.find(group => group.id === selectedUserId);
    if (!selected) {
      selectedHeader.replaceChildren();
      const title = document.createElement('h3');
      title.textContent = 'Chọn khách hàng';
      const hint = document.createElement('p');
      hint.textContent = 'Chọn một user bên trái để xem và trả lời riêng cuộc trò chuyện.';
      selectedHeader.append(title, hint);
      return;
    }
    selectedHeader.replaceChildren();
    const identity = document.createElement('div');
    identity.className = 'consultation-selected-identity';
    const title = document.createElement('h3');
    title.textContent = selected.name;
    const username = document.createElement('small');
    username.textContent = selected.username ? `Tài khoản: ${selected.username}` : `Mã khách hàng: ${selected.id}`;
    identity.append(title, username);
    const count = document.createElement('span');
    count.className = 'consultation-thread-count';
    count.textContent = `${selected.rows.length} câu hỏi · ${selected.pending} chờ trả lời`;
    selectedHeader.append(identity, count);
    const pendingRows = selected.rows.filter(item => item.status !== 'ANSWERED');
    if (!selected.rows.some(item => String(item.id) === String(selectedPendingId)) ||
        (selectedPendingId && !pendingRows.some(item => String(item.id) === String(selectedPendingId)) && pendingRows.length)) {
      selectedPendingId = pendingRows[0]?.id || selected.rows[selected.rows.length - 1]?.id || null;
    }
    selected.rows.forEach(messageCard);
    if (replyTargetWrap) replyTargetWrap.hidden = true;
    replyForm.hidden = selected.rows.length === 0;
    thread.scrollTop = thread.scrollHeight;
  }

  function renderUsers() {
    userList.replaceChildren();
    if (!conversations.length) {
      const empty = document.createElement('p');
      empty.className = 'consultations-empty';
      empty.textContent = 'Chưa có user gửi yêu cầu tư vấn.';
      userList.append(empty);
      selectedUserId = null;
      renderThread();
      return;
    }
    if (!conversations.some(group => group.id === selectedUserId)) selectedUserId = conversations[0].id;
    conversations.forEach(group => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `consultation-user${group.id === selectedUserId ? ' is-selected' : ''}`;
      button.setAttribute('aria-pressed', String(group.id === selectedUserId));
      const avatar = document.createElement('span');
      avatar.className = 'consultation-user-avatar';
      avatar.textContent = group.name.split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
      const details = document.createElement('span');
      details.className = 'consultation-user-details';
      const name = document.createElement('strong');
      name.textContent = group.name;
      const username = document.createElement('small');
      username.textContent = group.username || `Mã: ${group.id}`;
      const preview = document.createElement('small');
      preview.className = 'consultation-user-preview';
      preview.textContent = group.latest?.question || 'Đã gửi tệp đính kèm';
      details.append(name, username, preview);
      button.append(avatar, details);
      if (group.pending) {
        const pending = document.createElement('span');
        pending.className = 'consultation-user-pending';
        pending.textContent = String(group.pending);
        button.append(pending);
      }
      button.addEventListener('click', () => {
        selectedUserId = group.id;
        selectedPendingId = null;
        replyInput.value = '';
        renderUsers();
        renderThread();
      });
      userList.append(button);
    });
  }

  function render(rows) {
    conversations = groupByCustomer(rows);
    renderUsers();
    renderThread();
  }

  async function load() {
    if (busy) return;
    busy = true;
    try {
      const [rows, count] = await Promise.all([
        api.request('/consultations/manage', { headers }),
        api.request('/consultations/manage/pending-count', { headers })
      ]);
      const pending = Number(count.count) || 0;
      document.querySelectorAll('[data-consult-notice-count]').forEach(badge => {
        badge.textContent = pending > 99 ? '99+' : String(pending);
        badge.hidden = pending === 0;
      });
      if (lastPendingCount === null && pending > 0) status.textContent = `Có ${pending} yêu cầu tư vấn đang chờ trả lời.`;
      else if (lastPendingCount !== null && pending > lastPendingCount) status.textContent = 'Có yêu cầu tư vấn mới từ khách hàng.';
      lastPendingCount = pending;
      const nextSignature = JSON.stringify(rows);
      if (nextSignature !== signature) {
        signature = nextSignature;
        render(rows);
      }
      if (status.textContent.includes('yêu cầu tư vấn')) {
        window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => {
          if (status.textContent.includes('yêu cầu tư vấn')) status.textContent = '';
        }, 8000);
      }
    } catch (error) { status.textContent = `Không tải được hộp thư: ${error.message}`; }
    finally { busy = false; }
  }

  replyInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    replyForm.requestSubmit();
  });
  replyForm.addEventListener('submit', async event => {
    event.preventDefault();
    const answer = replyInput.value.trim();
    if (!answer || !selectedPendingId) return;
    const submit = replyForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Đang gửi phản hồi…';
    try {
      await api.request(`/consultations/manage/${encodeURIComponent(selectedPendingId)}/answer`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      replyInput.value = '';
      selectedPendingId = null;
      signature = '';
      await load();
      status.textContent = 'Đã gửi phản hồi.';
    } catch (error) {
      status.textContent = `Không gửi được phản hồi: ${error.message}`;
    } finally {
      submit.disabled = false;
    }
  });

  refresh?.addEventListener('click', load);
  document.querySelector('[data-workspace-tab="consult"]')?.addEventListener('click', load);
  load();
  window.setInterval(() => { if (!document.hidden) load(); }, 10000);
})();
