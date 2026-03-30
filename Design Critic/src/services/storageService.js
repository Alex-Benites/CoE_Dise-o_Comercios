import * as local from './localStorageService';
import * as sheets from './googleSheetsService';
import { STORAGE_KEYS } from '../utils/constants';

function useGoogleSheets() {
  try {
    const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKEND_CONFIG));
    return !!config?.scriptUrl;
  } catch {
    return false;
  }
}

function getBackend() {
  return useGoogleSheets() ? sheets : local;
}

// Wrap all calls to handle both sync (localStorage) and async (sheets) uniformly
async function call(method, ...args) {
  const backend = getBackend();
  return await Promise.resolve(backend[method](...args));
}

export const getDesigners = () => call('getDesigners');
export const getDesigner = (id) => call('getDesigner', id);
export const updateDesigner = (id, data) => call('updateDesigner', id, data);

export const getSessions = () => call('getSessions');
export const getSession = (id) => call('getSession', id);
export const createSession = (data) => call('createSession', data);
export const updateSession = (id, data) => call('updateSession', id, data);
export const deleteSession = (id) => call('deleteSession', id);

export const getAllFeedback = () => call('getAllFeedback');
export const getFeedback = (sessionId) => call('getFeedback', sessionId);
export const getFeedbackForDesigner = (designerId) => call('getFeedbackForDesigner', designerId);
export const createFeedback = (data) => call('createFeedback', data);
export const updateFeedback = (id, data) => call('updateFeedback', id, data);
export const deleteFeedback = (id) => call('deleteFeedback', id);

export function configureGoogleSheets(scriptUrl) {
  localStorage.setItem(STORAGE_KEYS.BACKEND_CONFIG, JSON.stringify({ scriptUrl }));
}

export function clearGoogleSheetsConfig() {
  localStorage.removeItem(STORAGE_KEYS.BACKEND_CONFIG);
}

export function isGoogleSheetsConfigured() {
  return useGoogleSheets();
}
