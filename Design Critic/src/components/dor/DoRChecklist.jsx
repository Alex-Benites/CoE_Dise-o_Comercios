import { motion } from 'framer-motion';
import { DOR_CATEGORIES, getRulesByCategory } from '../../utils/dorKeywords';
import styles from './DoRChecklist.module.css';

const statusIcons = {
  pass: '✅',
  fail: '❌',
  unreviewed: '⬜',
};

export default function DoRChecklist({ results, recommendations }) {
  if (!results) return null;

  return (
    <div className={styles.container}>
      {/* Checklist */}
      <div className={styles.checklist}>
        <h3 className={styles.title}>Checklist DoR</h3>
        {DOR_CATEGORIES.map(category => {
          const rules = getRulesByCategory(category);
          return (
            <div key={category} className={styles.categorySection}>
              <h4 className={styles.categoryTitle}>{category}</h4>
              <div className={styles.items}>
                {rules.map(rule => {
                  const result = results[rule.id];
                  if (!result) return null;
                  return (
                    <motion.div
                      key={rule.id}
                      className={`${styles.item} ${styles[result.status]}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={styles.statusIcon}>
                        {statusIcons[result.status]}
                      </span>
                      <span className={styles.itemLabel}>{rule.label}</span>
                      {result.matchedFeedback.length > 0 && (
                        <span className={styles.matchCount}>
                          {result.matchedFeedback.length}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h3 className={styles.title}>Recomendaciones</h3>
          <div className={styles.recList}>
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                className={styles.recItem}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.recHeader}>
                  <span className={styles.recCategory}>{rec.category}</span>
                  <span
                    className={styles.recSeverity}
                    style={{
                      color: rec.severity === 'Alta' ? 'var(--accent-danger)' : 'var(--accent-warning)',
                    }}
                  >
                    {rec.severity}
                  </span>
                </div>
                <p className={styles.recAction}>{rec.action}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
