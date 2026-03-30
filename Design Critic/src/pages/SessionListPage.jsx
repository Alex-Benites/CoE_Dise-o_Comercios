import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import SessionCard from '../components/session/SessionCard';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import styles from './SessionListPage.module.css';

export default function SessionListPage() {
  const { isLeader, currentUser } = useAuth();
  const { sessions } = useData();
  const navigate = useNavigate();

  // Active sessions notification for designers
  const activeSessions = sessions.filter(s => s.status !== 'closed');

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sesiones de Critique</h1>
          <p className={styles.subtitle}>
            {isLeader
              ? 'Gestiona las sesiones de design critique del equipo'
              : 'Participa en las sesiones activas y da tu feedback'
            }
          </p>
        </div>
        {isLeader && (
          <Button variant="accent" onClick={() => navigate('/sessions/new')} icon="➕">
            Nueva Sesión
          </Button>
        )}
      </div>

      {/* Active session badge for designers */}
      {!isLeader && activeSessions.length > 0 && (
        <motion.div
          className={styles.activeBanner}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={styles.activePulse} />
          <span>{activeSessions.length} sesión{activeSessions.length > 1 ? 'es' : ''} activa{activeSessions.length > 1 ? 's' : ''}</span>
        </motion.div>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No hay sesiones aún"
          message={isLeader
            ? 'Crea tu primera sesión de design critique'
            : 'Aún no hay sesiones programadas'
          }
          action={isLeader && (
            <Button variant="accent" onClick={() => navigate('/sessions/new')}>
              Crear primera sesión
            </Button>
          )}
        />
      ) : (
        <div className={styles.grid}>
          {sessions.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
