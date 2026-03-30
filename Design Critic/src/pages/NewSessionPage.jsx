import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import styles from './NewSessionPage.module.css';

export default function NewSessionPage() {
  const { currentUser } = useAuth();
  const { designers, addSession } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const designerList = designers.filter(d => d.role === 'designer');

  const [title, setTitle] = useState('');
  const [selectedPresenters, setSelectedPresenters] = useState([]);
  const [errors, setErrors] = useState({});

  const togglePresenter = (designer) => {
    setSelectedPresenters(prev => {
      const exists = prev.find(p => p.id === designer.id);
      if (exists) return prev.filter(p => p.id !== designer.id);
      return [...prev, designer];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'El título es obligatorio';
    if (selectedPresenters.length === 0) newErrors.presenters = 'Selecciona al menos un presentador';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const session = await addSession({
      title: title.trim(),
      presenters: selectedPresenters.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        figmaLink: '',
        screenshots: [],
      })),
      createdBy: currentUser.id,
    });

    addToast('Sesión creada exitosamente', 'success');
    navigate(`/sessions/${session.id}`);
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className={styles.title}>Nueva Sesión de Critique</h1>
      <p className={styles.subtitle}>Configura una nueva sesión para el equipo</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Título de la sesión *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Sprint 12 - Flujo de checkout"
            className={errors.title ? styles.inputError : ''}
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Diseñadores que presentan *</label>
          <p className={styles.hint}>Selecciona quiénes presentarán su trabajo en esta sesión</p>

          <div className={styles.presenterGrid}>
            {designerList.map(designer => {
              const isSelected = selectedPresenters.find(p => p.id === designer.id);
              return (
                <motion.div
                  key={designer.id}
                  className={`${styles.presenterCard} ${isSelected ? styles.selected : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => togglePresenter(designer)}
                >
                  <span className={styles.presenterAvatar}>{designer.avatar}</span>
                  <span className={styles.presenterName}>{designer.name}</span>
                  {isSelected && <span className={styles.check}>✓</span>}
                </motion.div>
              );
            })}
          </div>
          {errors.presenters && <span className={styles.error}>{errors.presenters}</span>}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/sessions')}>
            Cancelar
          </Button>
          <Button variant="accent" type="submit">
            Crear Sesión
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
