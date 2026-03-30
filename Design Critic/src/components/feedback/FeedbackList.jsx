import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { CATEGORIES, SEVERITY } from '../../utils/constants';
import FeedbackCard from './FeedbackCard';
import EmptyState from '../common/EmptyState';
import styles from './FeedbackList.module.css';

export default function FeedbackList({ feedback, presenters, selectedPresenter, onSelectPresenter }) {
  const { designers } = useData();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = useMemo(() => {
    let items = feedback;
    if (selectedPresenter) {
      items = items.filter(f => f.evaluatedId === selectedPresenter.id);
    }
    if (filterCategory !== 'all') {
      items = items.filter(f => f.category === filterCategory);
    }
    if (filterSeverity !== 'all') {
      items = items.filter(f => f.severity === filterSeverity);
    }
    return items;
  }, [feedback, selectedPresenter, filterCategory, filterSeverity]);

  const getEvaluatorName = (evaluatorId) => {
    const d = designers.find(d => d.id === evaluatorId);
    return d?.name || 'Anónimo';
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.presenterFilter}>
          <button
            className={`${styles.filterBtn} ${!selectedPresenter ? styles.filterActive : ''}`}
            onClick={() => onSelectPresenter(null)}
          >
            Todos
          </button>
          {presenters?.map(p => (
            <button
              key={p.id}
              className={`${styles.filterBtn} ${selectedPresenter?.id === p.id ? styles.filterActive : ''}`}
              onClick={() => onSelectPresenter(p)}
            >
              {p.avatar} {p.name}
            </button>
          ))}
        </div>

        <div className={styles.extraFilters}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {Object.values(CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="all">Toda severidad</option>
            {Object.values(SEVERITY).map(sev => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Sin feedback aún"
          message="Los feedbacks aparecerán aquí cuando se agreguen"
        />
      ) : (
        <div className={styles.list}>
          {filtered.map(item => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              showEvaluator
              evaluatorName={getEvaluatorName(item.evaluatorId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
