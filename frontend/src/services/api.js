/**
 * WordQue API client — communicates with FastAPI backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : '/api', 
  timeout: 600000, 
});

// ── Auth interceptor — attach JWT to all requests ─────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wordque_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────
export async function registerUser(email, password, name) {
  const { data } = await api.post('/auth/register', { email, password, name });
  return data;
}

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function googleLogin(idToken) {
  const { data } = await api.post('/auth/google', { id_token: idToken });
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfile(updates) {
  const { data } = await api.put('/auth/me', updates);
  return data;
}

// ── Upload ────────────────────────────────────────────────
export async function uploadPDFs(files, sessionId = null) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Chat ──────────────────────────────────────────────────
export async function sendChatMessage(query, topK = 5, sessionId = null) {
  const { data } = await api.post('/chat', {
    query,
    top_k: topK,
    session_id: sessionId,
  });
  return data;
}

// ── Summarize ─────────────────────────────────────────────
export async function summarizeDocument(docId = null) {
  const { data } = await api.post('/summarize', { doc_id: docId });
  return data;
}

// ── Quiz / Tutor ──────────────────────────────────────────
export async function generateQuiz({ topic, docId, numQuestions = 5, questionType = 'mcq' } = {}) {
  const { data } = await api.post('/tutor/generate', {
    topic,
    doc_id: docId,
    num_questions: numQuestions,
    question_type: questionType,
  });
  return data;
}

// ── Corpus ────────────────────────────────────────────────
export async function getCorpus() {
  const { data } = await api.get('/corpus');
  return data;
}

export async function deleteDocument(docId) {
  const { data } = await api.delete(`/corpus/${docId}`);
  return data;
}

export async function wipeKnowledgeBase() {
  const { data } = await api.delete('/corpus/wipe');
  return data;
}

export async function searchCorpus(query) {
  const { data } = await api.get('/search', { params: { q: query } });
  return data;
}

// ── Chat History ──────────────────────────────────────────
export async function getChatSessions() {
  const { data } = await api.get('/history');
  return data;
}

export async function getChatMessages(sessionId) {
  const { data } = await api.get(`/history/${sessionId}`);
  return data;
}

export async function createChatSession(title = 'New Chat') {
  const { data } = await api.post('/history', { title });
  return data;
}

export async function deleteChatSession(sessionId) {
  const { data } = await api.delete(`/history/${sessionId}`);
  return data;
}

export async function clearAllHistory() {
  const { data } = await api.delete('/history/clear-all');
  return data;
}

export async function updateSessionTitle(sessionId, title) {
  const { data } = await api.put(`/history/${sessionId}/title`, { title });
  return data;
}

// ── Analytics ─────────────────────────────────────────────
export async function getAnalytics() {
  const { data } = await api.get('/analytics');
  return data;
}

export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}
