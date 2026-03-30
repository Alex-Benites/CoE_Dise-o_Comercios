import { motion } from 'framer-motion';
import styles from './ProfileCard.module.css';

export default function ProfileCard({ user, onClick, delay = 0 }) {
  const isLeader = user.role === 'leader';

  return (
    <motion.div
      className={`${styles.card} ${isLeader ? styles.leader : styles.designer}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        scale: 1.08,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(user)}
    >
      <div className={styles.avatarContainer}>
        <span className={styles.avatar}>{user.avatar}</span>
        <div className={styles.glow} />
      </div>
      <h3 className={styles.name}>{user.name}</h3>
      <span className={styles.role}>
        {isLeader ? 'Líder' : 'Diseñador'}
      </span>
    </motion.div>
  );
}
