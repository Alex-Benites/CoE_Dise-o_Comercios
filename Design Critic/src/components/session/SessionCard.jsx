import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SESSION_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import styles from './SessionCard.module.css';

const statusConfig = {
  [SESSION_STATUS.OPEN]: { label: 'Abierta', color: 'var(--accent-success)', icon: '🟢' },
  [SESSION_STATUS.IN_PROGRESS]: { label: 'En curso', color: 'var(--accent-warning)', icon: '🟡' },
  [SESSION_STATUS.CLOSED]: { label: 'Cerrada', color: 'var(--text-muted)', icon: '⚪' },
};

export default function SessionCard({ session, index = 0 }) {
  const navigate = useNavigate();
  const status = statusConfig[session.status] || statusConfig.open;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate(`/sessions/${session.id}`)}
    >
      <div className={styles.header}>
        <span className={styles.status} style={{ color: status.color }}>
          {status.icon} {status.label}
        </span>
        <span className={styles.date}>{formatDate(session.createdAt)}</span>
      </div>

      <h3 className={styles.title}>{session.title}</h3>

      {session.project && (
        <p className={styles.project}>{session.project}</p>
      )}

      <div className={styles.presenters}>
        {session.presenters?.map(p => (
          <span key={p.id} className={styles.presenterAvatar} title={p.name}>
            {p.avatar}
          </span>
        ))}
      </div>

      {session.dorScore !== null && session.dorScore !== undefined && (
        <div className={styles.score}>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreFill}
              style={{
                width: `${session.dorScore}%`,
                background: session.dorScore >= 70
                  ? 'var(--accent-success)'
                  : session.dorScore >= 40
                    ? 'var(--accent-warning)'
                    : 'var(--accent-danger)',
              }}
            />
          </div>
          <span className={styles.scoreValue}>{Math.round(session.dorScore)}%</span>
        </div>
      )}
    </motion.div>
  );
}
