import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../../context/DataContext';
import { scoreFeedback, getOverallScore, getCategoryScores, detectRecurringIssues, generateInsights } from '../../services/dorScoringService';
import { DOR_CATEGORIES } from '../../utils/dorKeywords';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import styles from './DashboardCharts.module.css';

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

export default function LeaderDesignerDashboard({ designerId, onBack }) {
  const { sessions, allFeedback, designers } = useData();

  const designer = designers.find(d => d.id === designerId);
  const designerSessions = sessions.filter(s => s.presenters?.some(p => p.id === designerId));
  const closedSessions = designerSessions.filter(s => s.status === 'closed');
  const designerFeedback = allFeedback.filter(f => f.evaluatedId === designerId);

  // Score evolution per session
  const evolutionData = useMemo(() => {
    return closedSessions
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => {
        const score = s.presenterScores?.[designerId] || 0;
        return {
          name: formatDate(s.createdAt),
          score: Math.round(score),
          session: s.title,
        };
      });
  }, [closedSessions, designerId]);

  // Category breakdown (overall)
  const categoryBreakdown = useMemo(() => {
    if (designerFeedback.length === 0) return null;
    const results = scoreFeedback(designerFeedback);
    return getCategoryScores(results);
  }, [designerFeedback]);

  // Recurring issues
  const recurringIssues = useMemo(() => {
    const sessionResults = closedSessions.map(session => {
      const sf = allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === designerId);
      if (sf.length === 0) return null;
      return {
        sessionId: session.id,
        sessionTitle: session.title,
        results: scoreFeedback(sf),
        date: session.createdAt,
      };
    }).filter(Boolean);
    return detectRecurringIssues(sessionResults);
  }, [closedSessions, allFeedback, designerId]);

  // Strengths (categories with good scores)
  const strengths = useMemo(() => {
    if (!categoryBreakdown) return [];
    return DOR_CATEGORIES
      .filter(cat => categoryBreakdown[cat]?.score !== null && categoryBreakdown[cat].score >= 70)
      .map(cat => ({ category: cat, score: Math.round(categoryBreakdown[cat].score) }));
  }, [categoryBreakdown]);

  // Insights
  const insights = useMemo(() => {
    const sessionResults = closedSessions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(session => {
        const sf = allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === designerId);
        if (sf.length === 0) return null;
        return {
          sessionId: session.id,
          sessionTitle: session.title,
          results: scoreFeedback(sf),
          date: session.createdAt,
        };
      }).filter(Boolean);
    return generateInsights(sessionResults);
  }, [closedSessions, allFeedback, designerId]);

  if (!designer) {
    return <EmptyState icon="❓" title="Disenador no encontrado" message="" />;
  }

  return (
    <>
      <button className={styles.backBtn} onClick={onBack}>← Volver al dashboard global</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <span style={{ fontSize: '2.5rem' }}>{designer.avatar}</span>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{designer.name}</h2>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {closedSessions.length} sesiones | {designerFeedback.length} feedbacks recibidos
          </span>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 className={styles.chartTitle}>Insights</h3>
          <div className={styles.alertsList}>
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                className={`${styles.alertItem} ${
                  insight.type === 'positive' ? styles.alertSuccess :
                  insight.type === 'warning' ? styles.alertWarning : styles.alertDanger
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className={styles.alertIcon}>
                  {insight.type === 'positive' && '🎉'}
                  {insight.type === 'warning' && '⚠️'}
                  {insight.type === 'alert' && '🔴'}
                </span>
                {insight.message}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Evolution chart */}
        {evolutionData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Evolucion por sesion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent-secondary)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--accent-secondary)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category breakdown */}
        {categoryBreakdown && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Breakdown por categoria</h3>
            <div className={styles.categoryBreakdown}>
              {DOR_CATEGORIES.map(cat => {
                const data = categoryBreakdown[cat];
                const score = data?.score;
                const scoreClass = score === null ? styles.categoryScoreNa :
                  score >= 70 ? styles.categoryScoreGood :
                  score >= 40 ? styles.categoryScoreWarn : styles.categoryScoreBad;
                return (
                  <div key={cat} className={styles.categoryCard}>
                    <div className={styles.categoryName}>{cat}</div>
                    <div className={`${styles.categoryScore} ${scoreClass}`}>
                      {score !== null ? `${Math.round(score)}%` : '—'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                      {data?.passed || 0}/{data?.total || 0} items
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Fortalezas</h3>
            {strengths.map(s => (
              <div key={s.category} className={styles.strengthItem}>
                <span className={styles.strengthIcon}>✅</span>
                <span>{s.category}: {s.score}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recurring issues */}
      {recurringIssues.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 className={styles.chartTitle}>Issues recurrentes</h3>
          <div className={styles.issuesList}>
            {recurringIssues.map((issue, i) => (
              <motion.div
                key={issue.ruleId}
                className={styles.issueCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.issueHeader}>
                  <span className={styles.issueCategory}>{issue.category}</span>
                  <span className={styles.issueCount}>{issue.count} sesiones</span>
                </div>
                <p className={styles.issueLabel}>{issue.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
