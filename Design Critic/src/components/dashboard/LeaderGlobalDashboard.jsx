import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useData } from '../../context/DataContext';
import { scoreFeedback, getOverallScore, getCategoryScores, detectRecurringIssues, generateInsights } from '../../services/dorScoringService';
import { CATEGORIES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import styles from './DashboardCharts.module.css';

const CHART_COLORS = ['#00d4ff', '#7b2ff7', '#f5c518', '#46d369', '#e50914'];

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
}

export default function LeaderGlobalDashboard({ onSelectDesigner, onSelectSession }) {
  const { sessions, allFeedback, designers } = useData();

  const closedSessions = sessions.filter(s => s.status === 'closed');
  const designerList = designers.filter(d => d.role === 'designer');

  // KPI Metrics
  const totalSessions = sessions.length;
  const avgFeedbackPerSession = useMemo(() => {
    if (sessions.length === 0) return 0;
    return Math.round(allFeedback.length / sessions.length);
  }, [sessions, allFeedback]);

  const avgScore = useMemo(() => {
    const scores = closedSessions.filter(s => s.dorScore != null).map(s => s.dorScore);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [closedSessions]);

  // Evolution data
  const evolutionData = useMemo(() => {
    return closedSessions
      .filter(s => s.dorScore != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => ({
        name: formatDate(s.createdAt),
        score: Math.round(s.dorScore),
        session: s.title,
      }));
  }, [closedSessions]);

  // Recurring issues (team-wide)
  const recurringIssues = useMemo(() => {
    const sessionResults = closedSessions.map(session => {
      const sf = allFeedback.filter(f => f.sessionId === session.id);
      if (sf.length === 0) return null;
      return {
        sessionId: session.id,
        sessionTitle: session.title,
        results: scoreFeedback(sf),
        date: session.createdAt,
      };
    }).filter(Boolean);
    return detectRecurringIssues(sessionResults);
  }, [closedSessions, allFeedback]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    for (const cat of Object.values(CATEGORIES)) counts[cat] = 0;
    for (const f of allFeedback) {
      if (counts[f.category] !== undefined) counts[f.category]++;
    }
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [allFeedback]);

  // Designer comparison with ranking
  const designerScores = useMemo(() => {
    return designerList.map(d => {
      const dFeedback = allFeedback.filter(f => f.evaluatedId === d.id);
      if (dFeedback.length === 0) return { id: d.id, name: d.name, avatar: d.avatar, score: 0, feedbackCount: 0, sessions: 0 };
      const results = scoreFeedback(dFeedback);
      const score = getOverallScore(results);
      const dSessions = closedSessions.filter(s => s.presenters?.some(p => p.id === d.id));

      // Calculate improvement rate
      let improvement = 0;
      if (dSessions.length >= 2) {
        const sorted = dSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const firstScore = sorted[0].presenterScores?.[d.id] || 0;
        const lastScore = sorted[sorted.length - 1].presenterScores?.[d.id] || 0;
        improvement = lastScore - firstScore;
      }

      return {
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        score: Math.round(score.score),
        feedbackCount: dFeedback.length,
        sessions: dSessions.length,
        improvement: Math.round(improvement),
      };
    }).sort((a, b) => b.score - a.score);
  }, [designerList, allFeedback, closedSessions]);

  // Smart alerts
  const alerts = useMemo(() => {
    const alertList = [];

    for (const d of designerScores) {
      const dSessions = closedSessions
        .filter(s => s.presenters?.some(p => p.id === d.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Alert: no improvement in 3+ sessions
      if (dSessions.length >= 3) {
        const last3 = dSessions.slice(0, 3);
        const scores = last3.map(s => s.presenterScores?.[d.id] || 0);
        const allSameOrWorse = scores.every((s, i) => i === 0 || s >= scores[i - 1]);
        if (allSameOrWorse && scores[0] < 70) {
          alertList.push({
            type: 'danger',
            message: `${d.name} no ha mejorado en las ultimas ${last3.length} sesiones (score: ${Math.round(scores[0])}%)`,
          });
        }
      }

      // Alert: low recent performance
      if (d.score < 40 && d.feedbackCount > 0) {
        alertList.push({
          type: 'warning',
          message: `${d.name} tiene un score bajo: ${d.score}%`,
        });
      }

      // Alert: fast improvement
      if (d.improvement > 20) {
        alertList.push({
          type: 'success',
          message: `${d.name} mejoro ${d.improvement} puntos desde su primera sesion`,
        });
      }
    }

    return alertList;
  }, [designerScores, closedSessions]);

  if (sessions.length === 0) {
    return <EmptyState icon="📊" title="Sin datos aun" message="Crea sesiones para ver metricas del equipo" />;
  }

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <KpiCard icon="🎯" value={totalSessions} label="Total sesiones" />
        <KpiCard icon="💬" value={avgFeedbackPerSession} label="Feedback promedio/sesion" />
        <KpiCard icon="📊" value={avgScore !== null ? `${Math.round(avgScore)}%` : '—'} label="Score DoR promedio" />
        <KpiCard icon="🔄" value={recurringIssues.length} label="Issues recurrentes" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Alertas inteligentes</h2>
          <div className={styles.alertsList}>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                className={`${styles.alertItem} ${styles[`alert${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}`]}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className={styles.alertIcon}>
                  {alert.type === 'danger' && '🔴'}
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'success' && '🎉'}
                </span>
                {alert.message}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Evolution */}
        {evolutionData.length > 1 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Evolucion del equipo</h3>
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
                  activeDot={{ r: 7, stroke: 'var(--accent-secondary)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category distribution */}
        {categoryData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Feedback por categoria</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {categoryData.map((entry, i) => (
                <span key={entry.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Designer Comparison / Ranking */}
      {designerScores.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Ranking de disenadores</h2>
          <div className={`${styles.chartCard}`}>
            <div className={styles.designerList}>
              {designerScores.map((d, i) => (
                <motion.div
                  key={d.id}
                  className={styles.designerRow}
                  onClick={() => onSelectDesigner(d.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className={`${styles.rankBadge} ${i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankDefault}`}>
                    {i + 1}
                  </span>
                  <span className={styles.designerAvatar}>{d.avatar}</span>
                  <span className={styles.designerName}>{d.name}</span>
                  <div className={styles.designerBar}>
                    <motion.div
                      className={styles.designerFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.score}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      style={{
                        background: d.score >= 70 ? 'var(--accent-success)' : d.score >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      }}
                    />
                  </div>
                  <span className={styles.designerScore}>{d.score}%</span>
                  {d.improvement > 0 && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-success)' }}>
                      +{d.improvement}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recurring Issues */}
      {recurringIssues.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Issues recurrentes del equipo</h2>
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
                <div className={styles.issueSessions}>
                  {issue.sessions.map((s, j) => (
                    <span key={j} className={styles.issueSession}>{s.sessionTitle}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Session history (clickable) */}
      {closedSessions.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Sesiones cerradas</h2>
          <div className={styles.sessionHistoryList}>
            {closedSessions
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 10)
              .map(s => (
                <motion.div
                  key={s.id}
                  className={styles.sessionHistoryItem}
                  onClick={() => onSelectSession(s.id)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className={styles.sessionHistoryInfo}>
                    <span className={styles.sessionHistoryTitle}>{s.title}</span>
                    <span className={styles.sessionHistoryDate}>{formatDate(s.createdAt)}</span>
                  </div>
                  <span
                    className={styles.sessionHistoryScore}
                    style={{ color: s.dorScore >= 70 ? 'var(--accent-success)' : s.dorScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}
                  >
                    {s.dorScore != null ? `${Math.round(s.dorScore)}%` : '—'}
                  </span>
                </motion.div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}

function KpiCard({ icon, value, label }) {
  return (
    <motion.div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
      }}
      whileHover={{ borderColor: 'var(--accent-secondary)' }}
    >
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <div>
        <span style={{ display: 'block', fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{value}</span>
        <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{label}</span>
      </div>
    </motion.div>
  );
}
