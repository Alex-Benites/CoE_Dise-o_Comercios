import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { scoreFeedback, getOverallScore, detectRecurringIssues, generateInsights } from '../services/dorScoringService';
import { CATEGORIES, CATEGORY_COLORS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import styles from './DashboardPage.module.css';

const CHART_COLORS = ['#00d4ff', '#7b2ff7', '#f5c518', '#46d369', '#e50914'];

export default function DashboardPage() {
  const { currentUser, isLeader } = useAuth();
  const { sessions, allFeedback, designers } = useData();

  // Determine which sessions/feedback to show
  const relevantSessions = useMemo(() => {
    if (isLeader) return sessions;
    return sessions.filter(s =>
      s.presenters?.some(p => p.id === currentUser.id)
    );
  }, [sessions, isLeader, currentUser]);

  const relevantFeedback = useMemo(() => {
    if (isLeader) return allFeedback;
    return allFeedback.filter(f => f.evaluatedId === currentUser.id);
  }, [allFeedback, isLeader, currentUser]);

  // Metrics
  const totalSessions = relevantSessions.length;
  const totalFeedback = relevantFeedback.length;
  const closedSessions = relevantSessions.filter(s => s.status === 'closed');

  const avgScore = useMemo(() => {
    const scores = closedSessions
      .filter(s => s.dorScore !== null && s.dorScore !== undefined)
      .map(s => s.dorScore);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [closedSessions]);

  // Evolution data (score over time)
  const evolutionData = useMemo(() => {
    return closedSessions
      .filter(s => s.dorScore !== null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => ({
        name: formatDate(s.createdAt),
        score: Math.round(s.dorScore),
        session: s.title,
      }));
  }, [closedSessions]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    for (const cat of Object.values(CATEGORIES)) counts[cat] = 0;
    for (const f of relevantFeedback) {
      if (counts[f.category] !== undefined) counts[f.category]++;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [relevantFeedback]);

  // Severity distribution
  const severityData = useMemo(() => {
    const counts = { Baja: 0, Media: 0, Alta: 0 };
    for (const f of relevantFeedback) {
      if (counts[f.severity] !== undefined) counts[f.severity]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [relevantFeedback]);

  // Recurring issues
  const recurringIssues = useMemo(() => {
    const sessionResults = [];
    for (const session of closedSessions) {
      const sessionFeedback = isLeader
        ? allFeedback.filter(f => f.sessionId === session.id)
        : allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === currentUser.id);

      if (sessionFeedback.length > 0) {
        const results = scoreFeedback(sessionFeedback);
        sessionResults.push({
          sessionId: session.id,
          sessionTitle: session.title,
          results,
          date: session.createdAt,
        });
      }
    }
    return detectRecurringIssues(sessionResults);
  }, [closedSessions, allFeedback, isLeader, currentUser]);

  // Insights
  const insights = useMemo(() => {
    const sessionResults = [];
    const targetSessions = closedSessions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    for (const session of targetSessions) {
      const sessionFeedback = isLeader
        ? allFeedback.filter(f => f.sessionId === session.id)
        : allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === currentUser.id);

      if (sessionFeedback.length > 0) {
        sessionResults.push({
          sessionId: session.id,
          sessionTitle: session.title,
          results: scoreFeedback(sessionFeedback),
          date: session.createdAt,
        });
      }
    }
    return generateInsights(sessionResults);
  }, [closedSessions, allFeedback, isLeader, currentUser]);

  // Designer comparison (leader only)
  const designerScores = useMemo(() => {
    if (!isLeader) return [];
    const designerList = designers.filter(d => d.role === 'designer');
    return designerList.map(d => {
      const dFeedback = allFeedback.filter(f => f.evaluatedId === d.id);
      if (dFeedback.length === 0) return { name: d.name, avatar: d.avatar, score: 0, feedbackCount: 0 };
      const results = scoreFeedback(dFeedback);
      const score = getOverallScore(results);
      return { name: d.name, avatar: d.avatar, score: Math.round(score.score), feedbackCount: dFeedback.length };
    }).sort((a, b) => b.score - a.score);
  }, [isLeader, designers, allFeedback]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className={styles.title}>
        {isLeader ? 'Dashboard del Equipo' : 'Mi Dashboard'}
      </h1>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span className={styles.kpiIcon}>🎯</span>
          <div>
            <span className={styles.kpiValue}>{totalSessions}</span>
            <span className={styles.kpiLabel}>Sesiones</span>
          </div>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiIcon}>💬</span>
          <div>
            <span className={styles.kpiValue}>{totalFeedback}</span>
            <span className={styles.kpiLabel}>Feedbacks</span>
          </div>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiIcon}>📊</span>
          <div>
            <span className={styles.kpiValue}>
              {avgScore !== null ? `${Math.round(avgScore)}%` : '—'}
            </span>
            <span className={styles.kpiLabel}>Score Promedio</span>
          </div>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiIcon}>🔄</span>
          <div>
            <span className={styles.kpiValue}>{recurringIssues.length}</span>
            <span className={styles.kpiLabel}>Issues Recurrentes</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className={styles.insightsSection}>
          <h2 className={styles.sectionTitle}>Insights</h2>
          <div className={styles.insightsList}>
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                className={`${styles.insight} ${styles[insight.type]}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className={styles.insightIcon}>
                  {insight.type === 'positive' && '🎉'}
                  {insight.type === 'warning' && '⚠️'}
                  {insight.type === 'alert' && '🔴'}
                </span>
                {insight.message}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Evolution Chart */}
        {evolutionData.length > 1 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Evolución del Score</h3>
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

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Feedback por Categoría</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
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

        {/* Severity Distribution */}
        {severityData.some(d => d.value > 0) && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Distribución de Severidad</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="var(--severity-low)" />
                  <Cell fill="var(--severity-medium)" />
                  <Cell fill="var(--severity-high)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Designer Comparison (Leader only) */}
        {isLeader && designerScores.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Score por Diseñador</h3>
            <div className={styles.designerList}>
              {designerScores.map((d, i) => (
                <div key={i} className={styles.designerRow}>
                  <span className={styles.designerAvatar}>{d.avatar}</span>
                  <span className={styles.designerName}>{d.name}</span>
                  <div className={styles.designerBar}>
                    <motion.div
                      className={styles.designerFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.score}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      style={{
                        background: d.score >= 70
                          ? 'var(--accent-success)'
                          : d.score >= 40
                            ? 'var(--accent-warning)'
                            : 'var(--accent-danger)',
                      }}
                    />
                  </div>
                  <span className={styles.designerScore}>{d.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recurring Issues */}
      {recurringIssues.length > 0 && (
        <div className={styles.recurringSection}>
          <h2 className={styles.sectionTitle}>Issues Recurrentes</h2>
          <div className={styles.recurringList}>
            {recurringIssues.map((issue, i) => (
              <motion.div
                key={issue.ruleId}
                className={styles.recurringItem}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.recurringHeader}>
                  <span className={styles.recurringCategory}>{issue.category}</span>
                  <span className={styles.recurringCount}>{issue.count} sesiones</span>
                </div>
                <p className={styles.recurringLabel}>{issue.label}</p>
                <div className={styles.recurringSessions}>
                  {issue.sessions.map((s, j) => (
                    <span key={j} className={styles.recurringSession}>
                      {s.sessionTitle}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
