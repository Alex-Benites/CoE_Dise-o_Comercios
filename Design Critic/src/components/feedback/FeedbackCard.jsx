import { motion } from 'framer-motion';
import { SEVERITY_COLORS, CATEGORY_COLORS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import styles from './FeedbackCard.module.css';

export default function FeedbackCard({ feedback, showEvaluator = false, evaluatorName }) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.header}>
        <div className={styles.tags}>
          <span
            className={styles.category}
            style={{ borderColor: CATEGORY_COLORS[feedback.category] || 'var(--border-default)', color: CATEGORY_COLORS[feedback.category] }}
          >
            {feedback.category}
          </span>
          {feedback.subcategory && (
            <span className={styles.subcategory}>{feedback.subcategory}</span>
          )}
          <span
            className={styles.severity}
            style={{ background: SEVERITY_COLORS[feedback.severity] }}
          >
            {feedback.severity}
          </span>
        </div>
        <span className={styles.date}>{formatDateTime(feedback.createdAt)}</span>
      </div>

      <p className={styles.comment}>{feedback.comment}</p>

      {showEvaluator && evaluatorName && (
        <span className={styles.evaluator}>Por: {evaluatorName}</span>
      )}
    </motion.div>
  );
}
