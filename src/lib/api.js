const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

function buildUrl(path) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not configured.');
  }

  return `${API_BASE_URL}${path}`;
}

export function getStoredAuthToken() {
  return localStorage.getItem('authToken') || '';
}

export function setStoredAuthToken(token) {
  localStorage.setItem('authToken', token);
}

export function clearStoredAuthToken() {
  localStorage.removeItem('authToken');
}

function handleAuthFailure() {
  clearStoredAuthToken();
  window.dispatchEvent(new CustomEvent('prepbuddy:auth-expired'));
}

export async function apiRequest(path, options = {}) {
  const token = options.token ?? getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && token && !options.skipAuthFailureHandling) {
      handleAuthFailure();
      throw new Error('Your session expired. Please log in again.');
    }

    const message =
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'object' && data?.message) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function loginUser(payload) {
  return apiRequest('/login', {
    method: 'POST',
    body: payload,
    token: '',
    skipAuthFailureHandling: true,
  });
}

export function registerUser(payload) {
  return apiRequest('/register', {
    method: 'POST',
    body: payload,
    token: '',
    skipAuthFailureHandling: true,
  });
}

export function fetchProfile(token) {
  return apiRequest('/profile', { token });
}

export function fetchCatalog() {
  return apiRequest('/catalog');
}

export function updateProgressSection(section, data, updateActivity = true) {
  return apiRequest(`/progress/${section}`, {
    method: 'PUT',
    body: { data, updateActivity },
  });
}

export function updateUserSettings(payload) {
  return apiRequest('/settings', {
    method: 'PATCH',
    body: payload,
  });
}

export function searchJobs(payload) {
  return apiRequest('/search', {
    method: 'POST',
    body: payload,
  });
}

export function sendChatMessage(question) {
  return apiRequest('/chat', {
    method: 'POST',
    body: { question },
  });
}

export function generateQuiz(payload) {
  return apiRequest('/api/quiz/generate', {
    method: 'POST',
    body: payload,
  });
}

export function evaluateQuiz(payload) {
  return apiRequest('/api/quiz/evaluate', {
    method: 'POST',
    body: payload,
  });
}
