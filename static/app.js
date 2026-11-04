'use strict';

// ============================================================
// Сбор постов от спикеров — статическая версия (без сервера)
// Данные хранятся в localStorage браузера
// ============================================================

const TELEGRAM_BLUE = 'btn-telegram';
const PRIMARY_BLUE = 'btn-primary';

// Состояние
let speakers = [];
let posts = [];
let submitted = false;
let sending = false;
let editing = null;
let selectedPost = null;
let copiedInfo = null;

// DOM элементы
const dom = {
  // Форма
  speakerSelect: document.getElementById('speaker-select'),
  addSpeakerBtn: document.getElementById('add-speaker-btn'),
  addDialog: document.getElementById('add-dialog'),
  addDialogInput: document.getElementById('add-speaker-input'),
  addDialogCancel: document.getElementById('add-dialog-cancel'),
  addDialogSave: document.getElementById('add-dialog-save'),
  newSpeakerName: document.getElementById('new-speaker-name'),

  titleInput: document.getElementById('title-input'),
  contentTextarea: document.getElementById('content-textarea'),
  charCount: document.getElementById('char-count'),
  hashtagsInput: document.getElementById('hashtags-input'),

  draftBtn: document.getElementById('draft-btn'),
  publishBtn: document.getElementById('publish-btn'),
  cancelBtn: document.getElementById('cancel-btn'),
  submittedCard: document.getElementById('submitted-card'),
  createAnotherBtn: document.getElementById('create-another-btn'),

  // Список постов
  postsList: document.getElementById('posts-list'),
  emptyState: document.getElementById('empty-state'),
  filterSpeaker: document.getElementById('filter-speaker'),
  sortSelect: document.getElementById('sort-select'),
  publishedCountBadge: document.getElementById('published-count'),
  draftsCountBadge: document.getElementById('drafts-count'),
  filterInfo: document.getElementById('filter-info'),

  // Просмотр поста
  viewDialog: document.getElementById('view-dialog'),
  viewTitle: document.getElementById('view-title'),
  viewStatus: document.getElementById('view-status'),
  viewDate: document.getElementById('view-date'),
  viewSpeaker: document.getElementById('view-speaker'),
  viewContent: document.getElementById('view-content'),
  viewHashtags: document.getElementById('view-hashtags'),
  viewCloseBtn: document.getElementById('view-close-btn'),
  viewEditBtn: document.getElementById('view-edit-btn'),
  viewCopyTelegramBtn: document.getElementById('view-copy-telegram-btn'),
  viewCopyAllBtn: document.getElementById('view-copy-all-btn'),
  viewCopyTitleBtn: document.getElementById('view-copy-title-btn'),
  viewCopyContentBtn: document.getElementById('view-copy-content-btn'),
  viewCopyHashtagsBtn: document.getElementById('view-copy-hashtags-btn'),

  // Тосты
  toastContainer: document.getElementById('toast-container'),
};

// ============================================================
// Инициализация
// ============================================================

function init() {
  speakers = loadSpeakers();
  posts = loadPosts();

  renderSpeakersSelect();
  renderFilterSelect();
  renderPosts();

  // Слушатели событий формы
  dom.titleInput.addEventListener('input', () => {
    dom.titleInput.value = dom.titleInput.value.trim();
  });

  dom.contentTextarea.addEventListener('input', () => {
    dom.charCount.textContent = dom.contentTextarea.value.length + ' символов';
  });

  dom.hashtagsInput.addEventListener('input', normalizeHashtags);

  dom.draftBtn.addEventListener('click', () => handleSubmit('DRAFT'));
  dom.publishBtn.addEventListener('click', () => handleSubmit('PUBLISHED'));
  dom.cancelBtn.addEventListener('click', handleCancel);
  dom.createAnotherBtn.addEventListener('click', createAnother);

  // Слушатели диалога добавления спикера
  dom.addSpeakerBtn.addEventListener('click', openAddDialog);
  dom.addDialogCancel.addEventListener('click', closeAddDialog);
  dom.addDialogSave.addEventListener('click', saveNewSpeaker);
  dom.addDialogInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNewSpeaker();
  });
  dom.addDialog.addEventListener('click', (e) => {
    if (e.target === dom.addDialog) closeAddDialog();
  });

  // Слушатели диалога просмотра
  dom.viewCloseBtn.addEventListener('click', closeViewDialog);
  dom.viewEditBtn.addEventListener('click', () => {
    closeViewDialog();
    openEdit(selectedPost);
  });
  dom.viewCopyTelegramBtn.addEventListener('click', () => copyText(buildTelegramText(selectedPost), selectedPost.id, 'telegram'));
  dom.viewCopyAllBtn.addEventListener('click', () => copyText(buildFullPostText(selectedPost), selectedPost.id, 'all'));
  dom.viewCopyTitleBtn.addEventListener('click', () => copyText(selectedPost.title, selectedPost.id, 'title'));
  dom.viewCopyContentBtn.addEventListener('click', () => copyText(selectedPost.content, selectedPost.id, 'content'));
  dom.viewCopyHashtagsBtn.addEventListener('click', () => {
    if (selectedPost.hashtags) copyText(selectedPost.hashtags, selectedPost.id, 'hashtags');
  });

  // Слушатели фильтров
  dom.filterSpeaker.addEventListener('change', renderPosts);
  dom.sortSelect.addEventListener('change', renderPosts);

  // Закрытие диалогов по клавише Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAddDialog();
      closeViewDialog();
    }
  });
}

// ============================================================
// Данные
// ============================================================

function loadSpeakers() {
  const raw = localStorage.getItem('speaker-posts-speakers');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_SPEAKERS;
    }
  }
  localStorage.setItem('speaker-posts-speakers', JSON.stringify(DEFAULT_SPEAKERS));
  return DEFAULT_SPEAKERS;
}

function saveSpeakers(list) {
  localStorage.setItem('speaker-posts-speakers', JSON.stringify(list));
  speakers = list;
  renderSpeakersSelect();
  renderFilterSelect();
}

function loadPosts() {
  const raw = localStorage.getItem('speaker-posts-posts');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function savePosts(list) {
  localStorage.setItem('speaker-posts-posts', JSON.stringify(list));
  posts = list;
  renderPosts();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function normalizeHashtags() {
  const raw = dom.hashtagsInput.value;
  const tags = raw
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : '#' + t))
    .join(' ');
  dom.hashtagsInput.value = tags;
}

// ============================================================
// Рендеринг
// ============================================================

function renderSpeakersSelect() {
  dom.speakerSelect.innerHTML = '<option value="">Выберите спикера</option>';
  speakers.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    dom.speakerSelect.appendChild(opt);
  });
}

function renderFilterSelect() {
  const currentValue = dom.filterSpeaker.value;
  dom.filterSpeaker.innerHTML = '<option value="all">Все спикеры</option>';
  speakers.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    if (opt.value === currentValue) opt.selected = true;
    dom.filterSpeaker.appendChild(opt);
  });
}

function getSortedFilteredPosts() {
  let arr = filterSpeaker.value === 'all'
    ? [...posts]
    : posts.filter((p) => p.speakerId === filterSpeaker.value);

  const sortBy = sortSelect.value;
  if (sortBy === 'speakerAsc') {
    arr.sort((a, b) => {
      const sa = speakers.find((s) => s.id === a.speakerId)?.name ?? 'Я';
      const sb = speakers.find((s) => s.id === b.speakerId)?.name ?? 'Я';
      return sa.localeCompare(sb, 'ru');
    });
  } else if (sortBy === 'speakerDesc') {
    arr.sort((a, b) => {
      const sa = speakers.find((s) => s.id === a.speakerId)?.name ?? 'Я';
      const sb = speakers.find((s) => s.id === b.speakerId)?.name ?? 'Я';
      return sb.localeCompare(sa, 'ru');
    });
  } else {
    arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return arr;
}

function renderPosts() {
  const sorted = getSortedFilteredPosts();
  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = posts.length - publishedCount;

  dom.publishedCountBadge.textContent = 'Опубликовано: ' + publishedCount;
  dom.draftsCountBadge.textContent = 'Черновики: ' + draftCount;

  if (sorted.length === 0) {
    dom.postsList.style.display = 'none';
    dom.emptyState.style.display = 'block';
    if (filterSpeaker.value !== 'all') {
      const speakerName = speakers.find((s) => s.id === filterSpeaker.value)?.name;
      dom.filterInfo.textContent = 'Показаны посты спикера: ' + speakerName + ' · найдено 0';
      dom.filterInfo.style.display = 'block';
    } else {
      dom.filterInfo.style.display = 'none';
    }
    return;
  }

  dom.postsList.style.display = 'block';
  dom.emptyState.style.display = 'none';
  dom.filterInfo.style.display = 'none';

  if (filterSpeaker.value !== 'all') {
    const speakerName = speakers.find((s) => s.id === filterSpeaker.value)?.name;
    dom.filterInfo.textContent = 'Показаны посты спикера: ' + speakerName + ' · найдено ' + sorted.length;
    dom.filterInfo.style.display = 'block';
  } else {
    dom.filterInfo.style.display = 'none';
  }

  dom.postsList.innerHTML = '';
  sorted.forEach((post) => {
    const card = createPostCard(post);
    dom.postsList.appendChild(card);
  });
}

function createPostCard(post) {
  const li = document.createElement('li');
  li.className = 'post-card';
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-label', 'Открыть пост: ' + post.title);

  const speakerName = speakers.find((s) => s.id === post.speakerId)?.name ?? 'Без автора';
  const dateStr = formatDate(post.createdAt);
  const isDraft = post.status === 'DRAFT';

  li.innerHTML = `
    <div class="post-card-content">
      <div class="post-meta">
        <span class="status-badge ${isDraft ? 'status-draft' : 'status-published'}">
          ${isDraft ? 'Черновик' : 'Опубликован'}
        </span>
        <span class="post-date">${speakerName} · ${dateStr}</span>
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-excerpt">${escapeHtml(post.content)}</p>
      ${post.hashtags ? `
        <div class="post-hashtags">
          ${post.hashtags.split(' ').slice(0, 4).map((tag) => `<span class="hashtag-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="post-actions btn-group">
        ${isDraft ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); publishDraft('${post.id}')">Опубликовать</button>` : ''}
        <button class="btn btn-icon btn-ghost" onclick="event.stopPropagation(); openEdit(${JSON.stringify(post).replace(/'/g, "\\'")})" title="Редактировать">✏</button>
        <button class="btn btn-icon btn-ghost" onclick="event.stopPropagation(); deletePost('${post.id}')" title="Удалить">🗑</button>
      </div>
    </div>
  `;

  li.addEventListener('click', () => openView(post));
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openView(post);
    }
  });

  return li;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Действия с постами
// ============================================================

function handleSubmit(status) {
  const title = dom.titleInput.value.trim();
  const content = dom.contentTextarea.value.trim();
  const hashtags = dom.hashtagsInput.value.trim();
  const speakerId = dom.speakerSelect.value || null;

  if (!title) {
    showToast('Заполните заголовок', 'Пост не может быть без заголовка.', 'destructive');
    return;
  }
  if (!content) {
    showToast('Заполните текст поста', '', 'destructive');
    return;
  }
  if (status === 'PUBLISHED' && !speakerId) {
    showToast('Выберите автора', 'Выберите спикера, от имени которого публикуется пост.', 'destructive');
    return;
  }

  sending = true;
  dom.publishBtn.disabled = true;
  dom.draftBtn.disabled = true;

  setTimeout(() => {
    const now = new Date().toISOString();

    if (editing) {
      // Редактирование существующего
      const postIndex = posts.findIndex((p) => p.id === editing.id);
      if (postIndex !== -1) {
        posts[postIndex] = {
          ...editing,
          title,
          content,
          hashtags,
          speakerId,
          updatedAt: now,
          status: editing.status, // статус сохраняется
        };
      }
      editing = null;
      showToast('Изменения сохранены', '«' + title + '» обновлён.');
    } else {
      const newPost = {
        id: generateId(),
        title,
        content,
        hashtags,
        status,
        speakerId,
        createdAt: now,
        updatedAt: now,
      };
      posts.unshift(newPost);

      if (status === 'PUBLISHED') {
        submitted = true;
        showToast('Пост отправлен!', '«' + title + '» опубликован.');
      } else {
        showToast('Черновик сохранён', 'Вы можете вернуться к нему позже.');
        resetForm();
      }
    }

    savePosts(posts);
    resetFormState();
    sending = false;
    dom.publishBtn.disabled = false;
    dom.draftBtn.disabled = false;
  }, 400);
}

function resetForm() {
  dom.speakerSelect.value = '';
  dom.titleInput.value = '';
  dom.contentTextarea.value = '';
  dom.hashtagsInput.value = '';
  dom.charCount.textContent = '0 символов';
}

function resetFormState() {
  editing = null;
  submitted = false;
  dom.submittedCard.style.display = 'none';
  dom.cancelBtn.textContent = 'Отменить';
  dom.publishBtn.innerHTML = '<span>Отправить</span>';
  resetForm();
}

function handleCancel() {
  if (editing) {
    editing = null;
    resetFormState();
    showToast('Редактирование отменено');
  } else {
    resetForm();
    showToast('Форма очищена');
  }
}

function createAnother() {
  submitted = false;
  dom.submittedCard.style.display = 'none';
  resetForm();
}

function openEdit(post) {
  editing = post;
  dom.speakerSelect.value = post.speakerId ?? '';
  dom.titleInput.value = post.title;
  dom.contentTextarea.value = post.content;
  dom.hashtagsInput.value = post.hashtags ?? '';
  dom.charCount.textContent = post.content.length + ' символов';
  dom.cancelBtn.textContent = 'Отменить правку';
  dom.publishBtn.innerHTML = '<span>Сохранить изменения</span>';
  selectedPost = null;
  dom.viewDialog.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function publishDraft(id) {
  const post = posts.find((p) => p.id === id);
  if (!post) return;
  post.status = 'PUBLISHED';
  post.updatedAt = new Date().toISOString();
  savePosts(posts);
  showToast('Черновик опубликован');
}

function deletePost(id) {
  if (!confirm('Удалить этот пост безвозвратно?')) return;
  posts = posts.filter((p) => p.id !== id);
  savePosts(posts);
  showToast('Пост удалён');
}

// ============================================================
// Просмотр поста
// ============================================================

function openView(post) {
  selectedPost = post;
  dom.viewTitle.textContent = post.title;
  dom.viewStatus.textContent = post.status === 'DRAFT' ? 'Черновик' : 'Опубликован';
  dom.viewStatus.className = 'status-badge ' + (post.status === 'DRAFT' ? 'status-draft' : 'status-published');
  const speakerName = speakers.find((s) => s.id === post.speakerId)?.name ?? 'Без автора';
  dom.viewSpeaker.textContent = speakerName + ' · ' + formatDate(post.createdAt);
  dom.viewContent.textContent = post.content;
  dom.viewHashtags.innerHTML = '';
  if (post.hashtags) {
    post.hashtags.split(' ').forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'hashtag-chip';
      span.textContent = tag;
      dom.viewHashtags.appendChild(span);
    });
  }
  dom.viewDialog.style.display = 'flex';
}

function closeViewDialog() {
  selectedPost = null;
  dom.viewDialog.style.display = 'none';
}

// ============================================================
// Добавление спикера
// ============================================================

function openAddDialog() {
  dom.addDialogInput.value = '';
  dom.addDialog.style.display = 'flex';
  dom.addDialogInput.focus();
}

function closeAddDialog() {
  dom.addDialog.style.display = 'none';
}

function saveNewSpeaker() {
  const name = dom.addDialogInput.value.trim();
  if (!name) return;

  const existing = speakers.find((s) => s.name === name);
  if (existing) {
    dom.speakerSelect.value = existing.id;
    closeAddDialog();
    showToast('Спикер уже существует', name);
    return;
  }

  const newSpeaker = {
    id: generateId(),
    name,
  };
  speakers.push(newSpeaker);
  saveSpeakers(speakers);
  dom.speakerSelect.value = newSpeaker.id;
  closeAddDialog();
  showToast('Спикер добавлен', name);
}

// ============================================================
// Копирование в буфер обмена
// ============================================================

function buildFullPostText(post) {
  return [post.title, post.content, post.hashtags].filter(Boolean).join('\n\n');
}

function buildTelegramText(post) {
  return [post.content, post.hashtags].filter(Boolean).join('\n\n');
}

function copyText(text, postId, field) {
  if (!text) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyResult(postId, field);
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopyResult(postId, field);
  }
}

function showCopyResult(postId, field) {
  copiedInfo = { id: postId, field };
  const labels = {
    all: 'Пост скопирован',
    title: 'Заголовок скопирован',
    content: 'Текст скопирован',
    hashtags: 'Хештеги скопированы',
    telegram: 'Скопировано для Telegram',
  };
  showToast(labels[field], 'Вставьте текст в соцсети (Ctrl+V / ⌘+V)');

  setTimeout(() => {
    if (copiedInfo && copiedInfo.id === postId && copiedInfo.field === field) {
      copiedInfo = null;
    }
  }, 2000);
}

// ============================================================
// Тосты (уведомления)
// ============================================================

function showToast(title, description, variant) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + (variant === 'destructive' ? 'toast-destructive' : '');
  toast.innerHTML = `
    <div>
      <div class="toast-title">${escapeHtml(title)}</div>
      ${description ? '<div class="toast-description">${escapeHtml(description)}</div>' : ''}
    </div>
  `;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// Формат даты
// ============================================================

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================
// Запуск
// ============================================================

init();