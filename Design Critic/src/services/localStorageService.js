import { STORAGE_KEYS, DEFAULT_DESIGNERS, LEADER_PROFILE } from '../utils/constants';

function getItem(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Designers ---

export function getDesigners() {
  const designers = getItem(STORAGE_KEYS.DESIGNERS);
  if (!designers) {
    const defaults = [LEADER_PROFILE, ...DEFAULT_DESIGNERS];
    setItem(STORAGE_KEYS.DESIGNERS, defaults);
    return defaults;
  }
  return designers;
}

export function getDesigner(id) {
  return getDesigners().find(d => d.id === id) || null;
}

export function updateDesigner(id, data) {
  const designers = getDesigners();
  const index = designers.findIndex(d => d.id === id);
  if (index === -1) return null;
  designers[index] = { ...designers[index], ...data };
  setItem(STORAGE_KEYS.DESIGNERS, designers);
  return designers[index];
}

// --- Sessions ---

export function getSessions() {
  return getItem(STORAGE_KEYS.SESSIONS) || [];
}

export function getSession(id) {
  return getSessions().find(s => s.id === id) || null;
}

export function createSession(data) {
  const sessions = getSessions();
  const session = {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'open',
    dorScore: null,
  };
  sessions.unshift(session);
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  return session;
}

export function updateSession(id, data) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return null;
  sessions[index] = { ...sessions[index], ...data };
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  return sessions[index];
}

export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  // Also delete related feedback
  const feedback = getAllFeedback().filter(f => f.sessionId !== id);
  setItem(STORAGE_KEYS.FEEDBACK, feedback);
}

// --- Feedback ---

export function getAllFeedback() {
  return getItem(STORAGE_KEYS.FEEDBACK) || [];
}

export function getFeedback(sessionId) {
  return getAllFeedback().filter(f => f.sessionId === sessionId);
}

export function getFeedbackForDesigner(designerId) {
  return getAllFeedback().filter(f => f.evaluatedId === designerId);
}

export function createFeedback(data) {
  const feedback = getAllFeedback();
  const item = {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  feedback.unshift(item);
  setItem(STORAGE_KEYS.FEEDBACK, feedback);
  return item;
}

export function updateFeedback(id, data) {
  const feedback = getAllFeedback();
  const index = feedback.findIndex(f => f.id === id);
  if (index === -1) return null;
  feedback[index] = { ...feedback[index], ...data };
  setItem(STORAGE_KEYS.FEEDBACK, feedback);
  return feedback[index];
}

export function deleteFeedback(id) {
  const feedback = getAllFeedback().filter(f => f.id !== id);
  setItem(STORAGE_KEYS.FEEDBACK, feedback);
}
