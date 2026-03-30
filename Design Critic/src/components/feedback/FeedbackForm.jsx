import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../common/Toast';
import { CATEGORIES, SUBCATEGORIES, SEVERITY } from '../../utils/constants';
import { validateFeedback } from '../../utils/validators';
import Button from '../common/Button';
import styles from './FeedbackForm.module.css';

export default function FeedbackForm({ sessionId, evaluatedId, evaluatedName, evaluatorId, onClose }) {
  const { addFeedback } = useData();
  const { addToast } = useToast();

  const [feedbackItems, setFeedbackItems] = useState([createEmptyFeedback()]);

  function createEmptyFeedback() {
    return {
      category: '',
      subcategory: '',
      severity: '',
      comment: '',
    };
  }

  const updateItem = (index, field, value) => {
    setFeedbackItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Reset subcategory when category changes
      if (field === 'category') {
        updated[index].subcategory = '';
      }
      return updated;
    });
  };

  const addItem = () => {
    setFeedbackItems(prev => [...prev, createEmptyFeedback()]);
  };

  const removeItem = (index) => {
    if (feedbackItems.length === 1) return;
    setFeedbackItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all items
    for (let i = 0; i < feedbackItems.length; i++) {
      const errors = validateFeedback(feedbackItems[i]);
      if (errors) {
        addToast(`Feedback #${i + 1}: ${Object.values(errors)[0]}`, 'error');
        return;
      }
    }

    // Save all feedback items
    for (const item of feedbackItems) {
      await addFeedback({
        sessionId,
        evaluatedId,
        evaluatorId,
        category: item.category,
        subcategory: item.subcategory,
        severity: item.severity,
        comment: item.comment,
      });
    }

    addToast(`${feedbackItems.length} feedback(s) enviado(s)`, 'success');
    onClose();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        Evaluando a <strong>{evaluatedName}</strong>. Puedes agregar múltiples feedbacks.
      </p>

      {feedbackItems.map((item, index) => (
        <div key={index} className={styles.feedbackItem}>
          <div className={styles.itemHeader}>
            <span className={styles.itemNumber}>#{index + 1}</span>
            {feedbackItems.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeItem(index)}
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Categoría *</label>
              <div className={styles.categoryGrid}>
                {Object.values(CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.categoryBtn} ${item.category === cat ? styles.categoryActive : ''}`}
                    data-category={cat}
                    onClick={() => updateItem(index, 'category', cat)}
                  >
                    {cat === 'UX' && '🎯'}
                    {cat === 'UI' && '🎨'}
                    {cat === 'Contenido' && '✍️'}
                    {cat === 'Prototipo' && '🔗'}
                    {' '}{cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {item.category && SUBCATEGORIES[item.category] && (
            <div className={styles.field}>
              <label>Subcategoría</label>
              <select
                value={item.subcategory}
                onChange={e => updateItem(index, 'subcategory', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {SUBCATEGORIES[item.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label>Severidad *</label>
            <div className={styles.severityGrid}>
              {Object.values(SEVERITY).map(sev => (
                <button
                  key={sev}
                  type="button"
                  className={`${styles.severityBtn} ${item.severity === sev ? styles.severityActive : ''}`}
                  data-severity={sev}
                  onClick={() => updateItem(index, 'severity', sev)}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Comentario *</label>
            <textarea
              value={item.comment}
              onChange={e => updateItem(index, 'comment', e.target.value)}
              placeholder="Describe tu observación con detalle..."
              rows={3}
            />
          </div>
        </div>
      ))}

      <button type="button" className={styles.addMore} onClick={addItem}>
        + Agregar otro feedback
      </button>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="accent" type="submit">
          Enviar Feedback ({feedbackItems.length})
        </Button>
      </div>
    </form>
  );
}
