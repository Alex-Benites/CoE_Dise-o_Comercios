import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as storage from '../services/storageService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [designers, setDesigners] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s, f] = await Promise.all([
        storage.getDesigners(),
        storage.getSessions(),
        storage.getAllFeedback(),
      ]);
      setDesigners(d || []);
      setSessions(s || []);
      setAllFeedback(f || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Session actions ---
  const addSession = useCallback(async (data) => {
    const session = await storage.createSession(data);
    setSessions(prev => [session, ...prev]);
    return session;
  }, []);

  const editSession = useCallback(async (id, data) => {
    const updated = await storage.updateSession(id, data);
    setSessions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, []);

  const removeSession = useCallback(async (id) => {
    await storage.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    setAllFeedback(prev => prev.filter(f => f.sessionId !== id));
  }, []);

  // --- Feedback actions ---
  const addFeedback = useCallback(async (data) => {
    const item = await storage.createFeedback(data);
    setAllFeedback(prev => [item, ...prev]);
    return item;
  }, []);

  const editFeedback = useCallback(async (id, data) => {
    const updated = await storage.updateFeedback(id, data);
    setAllFeedback(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  }, []);

  const removeFeedback = useCallback(async (id) => {
    await storage.deleteFeedback(id);
    setAllFeedback(prev => prev.filter(f => f.id !== id));
  }, []);

  // --- Helpers ---
  const getSessionFeedback = useCallback((sessionId) => {
    return allFeedback.filter(f => f.sessionId === sessionId);
  }, [allFeedback]);

  const getDesignerFeedback = useCallback((designerId) => {
    return allFeedback.filter(f => f.evaluatedId === designerId);
  }, [allFeedback]);

  const getDesignerSessions = useCallback((designerId) => {
    return sessions.filter(s =>
      s.presenters?.some(p => p.id === designerId)
    );
  }, [sessions]);

  return (
    <DataContext.Provider value={{
      designers,
      sessions,
      allFeedback,
      loading,
      loadData,
      addSession,
      editSession,
      removeSession,
      addFeedback,
      editFeedback,
      removeFeedback,
      getSessionFeedback,
      getDesignerFeedback,
      getDesignerSessions,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
