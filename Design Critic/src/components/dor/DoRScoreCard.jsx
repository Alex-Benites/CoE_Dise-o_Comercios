import { motion } from 'framer-motion';
import { DOR_CATEGORIES } from '../../utils/dorKeywords';
import styles from './DoRScoreCard.module.css';

export default function DoRScoreCard({ score, categoryScores }) {
  if (!score) return null;

  const scoreColor = score.score >= 70
    ? 'var(--accent-success)'
    : score.score >= 40
      ? 'var(--accent-warning)'
      : 'var(--accent-danger)';

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (score.score / 100) * circumference;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Score DoR</h3>

      <div className={styles.scoreCircle}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="8"
          />
          <motion.circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className={styles.scoreText}>
          <span className={styles.scoreValue} style={{ color: scoreColor }}>
            {Math.round(score.score)}%
          </span>
          <span className={styles.scoreLabel}>
            {score.passed}/{score.reviewed} items
          </span>
        </div>
      </div>

      <div className={styles.coverage}>
        <span className={styles.coverageLabel}>Cobertura</span>
        <div className={styles.coverageBar}>
          <motion.div
            className={styles.coverageFill}
            initial={{ width: 0 }}
            animate={{ width: `${score.coverage}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
        <span className={styles.coverageValue}>{Math.round(score.coverage)}%</span>
      </div>

      <div className={styles.categories}>
        {DOR_CATEGORIES.map(cat => {
          const catScore = categoryScores?.[cat];
          if (!catScore) return null;
          return (
            <div key={cat} className={styles.catRow}>
              <span className={styles.catName}>{cat}</span>
              <div className={styles.catBar}>
                <motion.div
                  className={styles.catFill}
                  style={{
                    background: catScore.score >= 70
                      ? 'var(--accent-success)'
                      : catScore.score >= 40
                        ? 'var(--accent-warning)'
                        : 'var(--accent-danger)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: catScore.score !== null ? `${catScore.score}%` : '0%' }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
              </div>
              <span className={styles.catValue}>
                {catScore.score !== null ? `${Math.round(catScore.score)}%` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
