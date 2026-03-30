import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LeaderGlobalDashboard from '../components/dashboard/LeaderGlobalDashboard';
import LeaderDesignerDashboard from '../components/dashboard/LeaderDesignerDashboard';
import SessionDashboard from '../components/dashboard/SessionDashboard';
import DesignerPersonalDashboard from '../components/dashboard/DesignerPersonalDashboard';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { isLeader } = useAuth();

  // Leader sub-navigation state
  const [view, setView] = useState('global'); // 'global' | 'designer' | 'session'
  const [selectedDesignerId, setSelectedDesignerId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const handleSelectDesigner = (designerId) => {
    setSelectedDesignerId(designerId);
    setView('designer');
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setView('session');
  };

  const handleBackToGlobal = () => {
    setView('global');
    setSelectedDesignerId(null);
    setSelectedSessionId(null);
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className={styles.title}>
        {isLeader
          ? (view === 'global' ? 'Dashboard del Equipo' :
             view === 'designer' ? 'Dashboard del Disenador' :
             'Dashboard de Sesion')
          : 'Mi Dashboard'}
      </h1>

      {isLeader ? (
        <>
          {view === 'global' && (
            <LeaderGlobalDashboard
              onSelectDesigner={handleSelectDesigner}
              onSelectSession={handleSelectSession}
            />
          )}
          {view === 'designer' && selectedDesignerId && (
            <LeaderDesignerDashboard
              designerId={selectedDesignerId}
              onBack={handleBackToGlobal}
            />
          )}
          {view === 'session' && selectedSessionId && (
            <SessionDashboard
              sessionId={selectedSessionId}
              onBack={handleBackToGlobal}
            />
          )}
        </>
      ) : (
        <DesignerPersonalDashboard />
      )}
    </motion.div>
  );
}
