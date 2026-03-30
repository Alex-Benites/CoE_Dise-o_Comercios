import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProfileCard from '../components/profile/ProfileCard';
import styles from './ProfileSelectPage.module.css';

export default function ProfileSelectPage() {
  const { login } = useAuth();
  const { designers } = useData();
  const navigate = useNavigate();

  const handleSelect = (user) => {
    login(user);
    navigate('/sessions');
  };

  const leader = designers.find(d => d.role === 'leader');
  const designerList = designers.filter(d => d.role === 'designer');

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.header}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Design Crit Tracker
          </motion.h1>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Selecciona tu perfil para continuar
          </motion.p>
        </div>

        {leader && (
          <motion.div
            className={styles.leaderSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ProfileCard user={leader} onClick={handleSelect} delay={0.3} />
          </motion.div>
        )}

        <motion.div
          className={styles.divider}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <span className={styles.dividerText}>Equipo</span>
        </motion.div>

        <div className={styles.grid}>
          {designerList.map((designer, i) => (
            <ProfileCard
              key={designer.id}
              user={designer}
              onClick={handleSelect}
              delay={0.4 + i * 0.1}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
