// Начальные данные: спикеры по умолчанию
const DEFAULT_SPEAKERS = [
  { id: 'spk-1', name: 'Иванова Влада' },
  { id: 'spk-2', name: 'Нефедова Ксения' },
  { id: 'spk-3', name: 'Николова Алия' },
  { id: 'spk-4', name: 'Хакимова Наталья' },
  { id: 'spk-5', name: 'Вереникина Женя' }
];

// Хранилище в localStorage
const STORAGE_KEY_SPEAKERS = 'speaker-posts-speakers';
const STORAGE_KEY_POSTS = 'speaker-posts-posts';

function loadSpeakers() {
  const raw = localStorage.getItem(STORAGE_KEY_SPEAKERS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_SPEAKERS;
    }
  }
  // Первая инициализация — записываем список по умолчанию
  localStorage.setItem(STORAGE_KEY_SPEAKERS, JSON.stringify(DEFAULT_SPEAKERS));
  return DEFAULT_SPEAKERS;
}

function saveSpeakers(speakers) {
  localStorage.setItem(STORAGE_KEY_SPEAKERS, JSON.stringify(speakers));
}

function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEY_POSTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}