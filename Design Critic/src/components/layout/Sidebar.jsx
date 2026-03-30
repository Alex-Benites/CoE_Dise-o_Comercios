import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const leaderLinks = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/sessions', icon: '🎯', label: 'Sesiones', end: true },
  { to: '/sessions/new', icon: '➕', label: 'Nueva Sesión' },
];

const designerLinks = [
  { to: '/dashboard', icon: '📊', label: 'Mi Dashboard' },
  { to: '/sessions', icon: '🎯', label: 'Sesiones' },
];

export default function Sidebar() {
  const { currentUser, isLeader, logout } = useAuth();
  const links = isLeader ? leaderLinks : designerLinks;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>🎮</span>
        <span className={styles.title}>Design Crit</span>
      </div>

      <nav className={styles.nav}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.linkIcon}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar}>{currentUser?.avatar}</span>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{currentUser?.name}</span>
            <span className={styles.userRole}>
              {isLeader ? 'Líder' : 'Diseñador'}
            </span>
          </div>
        </div>
        <button className={styles.logout} onClick={logout}>
          Salir
        </button>
      </div>
    </aside>
  );
}
