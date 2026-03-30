// Google Sheets backend via Google Apps Script Web App
// Configure by setting the script URL in localStorage (dcr_backend_config)

import { STORAGE_KEYS } from '../utils/constants';

function getScriptUrl() {
  try {
    const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKEND_CONFIG));
    return config?.scriptUrl || null;
  } catch {
    return null;
  }
}

async function request(action, params = {}) {
  const url = getScriptUrl();
  if (!url) throw new Error('Google Sheets no configurado');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) throw new Error('Error en la conexión con Google Sheets');
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.data;
}

// --- Designers ---
export async function getDesigners() {
  return request('getDesigners');
}

export async function getDesigner(id) {
  return request('getDesigner', { id });
}

export async function updateDesigner(id, data) {
  return request('updateDesigner', { id, data });
}

// --- Sessions ---
export async function getSessions() {
  return request('getSessions');
}

export async function getSession(id) {
  return request('getSession', { id });
}

export async function createSession(data) {
  return request('createSession', { data: { ...data, id: crypto.randomUUID() } });
}

export async function updateSession(id, data) {
  return request('updateSession', { id, data });
}

export async function deleteSession(id) {
  return request('deleteSession', { id });
}

// --- Feedback ---
export async function getAllFeedback() {
  return request('getAllFeedback');
}

export async function getFeedback(sessionId) {
  return request('getFeedback', { sessionId });
}

export async function getFeedbackForDesigner(designerId) {
  return request('getFeedbackForDesigner', { designerId });
}

export async function createFeedback(data) {
  return request('createFeedback', { data: { ...data, id: crypto.randomUUID() } });
}

export async function updateFeedback(id, data) {
  return request('updateFeedback', { id, data });
}

export async function deleteFeedback(id) {
  return request('deleteFeedback', { id });
}
