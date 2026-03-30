import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '../../context/DataContext';
import { scoreFeedback, getOverallScore, getCategoryScores, getRecommendations } from '../../services/dorScoringService';
import { DOR_CATEGORIES } from '../../utils/dorKeywords';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import styles from './DashboardCharts.module.css';

const SCORE_COLORS = ['#00d4ff', '#7b2ff7', '#f5c518', '#46d369'];

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}%</p>
        ))}
      </div>
    );
  }
  return null;
}

export default function SessionDashboard({ sessionId, onBack }) {
  const { sessions, allFeedback } = useData();

  const session = sessions.find(s => s.id === sessionId);
  const sessionFeedback = allFeedback.filter(f => f.sessionId === sessionId);

  // Per-designer scores
  const presenterData = useMemo(() => {
    if (!session?.presenters) return [];
    return session.presenters.map(p => {
      const pf = sessionFeedback.filter(f => f.evaluatedId === p.id);
      const results = scoreFeedback(pf);
      const overall = getOverallScore(results);
      const categories = getCategoryScores(results);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: Math.round(overall.score),
        feedbackCount: pf.length,
        categories,
      };
    });
  }, [session, sessionFeedback]);

  // Issues detected in this session
  const sessionIssues = useMemo(() => {
    const results = scoreFeedback(sessionFeedback);
    const failed = Object.values(results).filter(r => r.status === 'fail');
    return failed.map(r => ({
      category: r.category,
      label: r.label,
      count: r.matchedFeedback.length,
    })).sort((a, b) => b.count - a.count);
  }, [sessionFeedback]);

  // Most repeated feedback (by subcategory)
  const repeatedFeedback = useMemo(() => {
    const counts = {};
    for (const f of sessionFeedback) {
      const key = `${f.category} - ${f.subcategory || 'General'}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [sessionFeedback]);

  // Recommendations
  const recommendations = useMemo(() => {
    const results = scoreFeedback(sessionFeedback);
    return getRecommendations(results);
  }, [sessionFeedback]);

  // Chart data for per-designer scores
  const scoreChartData = useMemo(() => {
    return presenterData.map(p => ({ name: p.name, score: p.score }));
  }, [presenterData]);

  if (!session) {
    return <EmptyState icon="❓" title="Sesion no encontrada" message="" />;
  }

  const evaluatorCount = new Set(sessionFeedback.map(f => f.evaluatorId)).size;

  return (
    <>
      <button className={styles.backBtn} onClick={onBack}>← Volver al dashboard</button>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
        {session.title}
      </h2>

      {/* Summary */}
      <div className={styles.sessionSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Fecha</span>
          <span className={styles.summaryValue}>{formatDate(session.createdAt)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Presentadores</span>
          <span className={styles.summaryValue}>{session.presenters?.length || 0}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Evaluadores</span>
          <span className={styles.summaryValue}>{evaluatorCount}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Score per designer */}
        {scoreChartData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Score por disenador</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {scoreChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.score >= 70 ? 'var(--accent-success)' : entry.score >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category breakdown per designer */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Breakdown por categoria</h3>
          {presenterData.map(p => (
            <div key={p.id} style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                {p.avatar} {p.name}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {DOR_CATEGORIES.map(cat => {
                  const score = p.categories[cat]?.score;
                  const color = score === null ? 'var(--text-muted)' :
                    score >= 70 ? 'var(--accent-success)' :
                    score >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';
                  return (
                    <span key={cat} style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      color,
                      fontWeight: 700,
                    }}>
                      {cat}: {score !== null ? `${Math.round(score)}%` : '—'}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues detected */}
      {sessionIssues.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 className={styles.chartTitle}>Issues detectados</h3>
          <div className={styles.issuesList}>
            {sessionIssues.map((issue, i) => (
              <motion.div
                key={i}
                className={styles.issueCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.issueHeader}>
                  <span className={styles.issueCategory}>{issue.category}</span>
                  <span className={styles.issueCount}>{issue.count} matches</span>
                </div>
                <p className={styles.issueLabel}>{issue.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Most repeated feedback */}
      {repeatedFeedback.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Feedback mas repetido</h3>
            <div className={styles.feedbackSummaryList}>
              {repeatedFeedback.map((item, i) => (
                <div key={i} className={styles.feedbackSummaryItem}>
                  <span className={styles.feedbackSummaryCount}>x{item.count}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Recomendaciones</h3>
            <div className={styles.alertsList}>
              {recommendations.map((rec, i) => (
                <div key={i} className={`${styles.alertItem} ${styles.alertWarning}`}>
                  <span className={styles.alertIcon}>💡</span>
                  <div>
                    <strong>{rec.category}:</strong> {rec.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
