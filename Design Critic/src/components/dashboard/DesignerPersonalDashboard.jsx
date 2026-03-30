import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { scoreFeedback, getOverallScore, getCategoryScores, getRecommendations, detectRecurringIssues, generateInsights } from '../../services/dorScoringService';
import { DOR_CATEGORIES } from '../../utils/dorKeywords';
import { formatDate } from '../../utils/formatters';
import FeedbackList from '../feedback/FeedbackList';
import DoRScoreCard from '../dor/DoRScoreCard';
import DoRChecklist from '../dor/DoRChecklist';
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

export default function DesignerPersonalDashboard() {
  const { currentUser } = useAuth();
  const { sessions, allFeedback } = useData();
  const navigate = useNavigate();

  const [expandedSession, setExpandedSession] = useState(null);

  const mySessions = sessions.filter(s => s.presenters?.some(p => p.id === currentUser.id));
  const closedSessions = mySessions.filter(s => s.status === 'closed');
  const myFeedbackReceived = allFeedback.filter(f => f.evaluatedId === currentUser.id);

  // Overall score
  const overallData = useMemo(() => {
    if (myFeedbackReceived.length === 0) return null;
    const results = scoreFeedback(myFeedbackReceived);
    return {
      overall: getOverallScore(results),
      categories: getCategoryScores(results),
      results,
      recommendations: getRecommendations(results),
    };
  }, [myFeedbackReceived]);

  // Evolution data
  const evolutionData = useMemo(() => {
    return closedSessions
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => ({
        name: formatDate(s.createdAt),
        score: Math.round(s.presenterScores?.[currentUser.id] || 0),
        session: s.title,
        sessionId: s.id,
      }));
  }, [closedSessions, currentUser.id]);

  // Avg score
  const avgScore = useMemo(() => {
    const scores = closedSessions
      .filter(s => s.presenterScores?.[currentUser.id] != null)
      .map(s => s.presenterScores[currentUser.id]);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [closedSessions, currentUser.id]);

  // Recurring issues
  const recurringIssues = useMemo(() => {
    const sessionResults = closedSessions.map(session => {
      const sf = allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === currentUser.id);
      if (sf.length === 0) return null;
      return {
        sessionId: session.id,
        sessionTitle: session.title,
        results: scoreFeedback(sf),
        date: session.createdAt,
      };
    }).filter(Boolean);
    return detectRecurringIssues(sessionResults);
  }, [closedSessions, allFeedback, currentUser.id]);

  // Insights
  const insights = useMemo(() => {
    const sessionResults = closedSessions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(session => {
        const sf = allFeedback.filter(f => f.sessionId === session.id && f.evaluatedId === currentUser.id);
        if (sf.length === 0) return null;
        return {
          sessionId: session.id,
          sessionTitle: session.title,
          results: scoreFeedback(sf),
          date: session.createdAt,
        };
      }).filter(Boolean);
    return generateInsights(sessionResults);
  }, [closedSessions, allFeedback, currentUser.id]);

  // Expanded session detail
  const expandedSessionData = useMemo(() => {
    if (!expandedSession) return null;
    const session = sessions.find(s => s.id === expandedSession);
    if (!session) return null;
    const sf = allFeedback.filter(f => f.sessionId === expandedSession && f.evaluatedId === currentUser.id);
    const results = scoreFeedback(sf);
    return {
      session,
      feedback: sf,
      overall: getOverallScore(results),
      categories: getCategoryScores(results),
      results,
      recommendations: getRecommendations(results),
    };
  }, [expandedSession, sessions, allFeedback, currentUser.id]);

  if (mySessions.length === 0) {
    return <EmptyState icon="📊" title="Sin datos aun" message="Participa en sesiones para ver tu dashboard personal" />;
  }

  return (
    <>
      {/* 1. Mi rendimiento */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 className={styles.chartTitle}>Mi rendimiento</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <div className={styles.chartCard} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Promedio general</div>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: avgScore === null ? 'var(--text-muted)' :
                avgScore >= 70 ? 'var(--accent-success)' :
                avgScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
            }}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
              {closedSessions.length} sesiones
            </div>
          </div>
          {evolutionData.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Score DoR por sesion</h3>
              <ResponsiveContainer width="100%" height={200}>
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
        </div>
      </section>

      {/* 2. Breakdown personal */}
      {overallData && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Breakdown personal</h2>
          <div className={styles.chartCard}>
            <div className={styles.categoryBreakdown}>
              {DOR_CATEGORIES.map(cat => {
                const data = overallData.categories[cat];
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
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Insights</h2>
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

      {/* 3. Issues recurrentes personales */}
      {recurringIssues.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className={styles.chartTitle}>Issues recurrentes</h2>
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

      {/* 4. Recommendations */}
      {overallData?.recommendations?.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Recomendaciones</h3>
            <div className={styles.alertsList}>
              {overallData.recommendations.slice(0, 5).map((rec, i) => (
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

      {/* 5. Historial de sesiones */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 className={styles.chartTitle}>Historial de sesiones</h2>
        <div className={styles.sessionHistoryList}>
          {mySessions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(s => {
              const score = s.presenterScores?.[currentUser.id];
              const isExpanded = expandedSession === s.id;
              return (
                <div key={s.id}>
                  <motion.div
                    className={styles.sessionHistoryItem}
                    onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                    whileHover={{ scale: 1.01 }}
                    style={isExpanded ? { borderColor: 'var(--accent-secondary)', background: 'rgba(0,212,255,0.03)' } : {}}
                  >
                    <div className={styles.sessionHistoryInfo}>
                      <span className={styles.sessionHistoryTitle}>{s.title}</span>
                      <span className={styles.sessionHistoryDate}>
                        {formatDate(s.createdAt)} · {s.status === 'closed' ? 'Cerrada' : s.status === 'in_progress' ? 'En curso' : 'Abierta'}
                      </span>
                    </div>
                    {score != null ? (
                      <span
                        className={styles.sessionHistoryScore}
                        style={{ color: score >= 70 ? 'var(--accent-success)' : score >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}
                      >
                        {Math.round(score)}%
                      </span>
                    ) : (
                      <span className={styles.sessionHistoryScore} style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </motion.div>

                  {/* 6. Session detail expanded */}
                  {isExpanded && expandedSessionData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderTop: 'none',
                        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                        <DoRScoreCard score={expandedSessionData.overall} categoryScores={expandedSessionData.categories} />
                        <div>
                          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                            Feedback recibido ({expandedSessionData.feedback.length})
                          </h4>
                          <FeedbackList
                            feedback={expandedSessionData.feedback}
                            presenters={expandedSessionData.session.presenters}
                            selectedPresenter={expandedSessionData.session.presenters?.find(p => p.id === currentUser.id)}
                            onSelectPresenter={() => {}}
                          />
                        </div>
                      </div>

                      {expandedSessionData.recommendations.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Problemas detectados</h4>
                          {expandedSessionData.recommendations.map((rec, i) => (
                            <div key={i} style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: 'var(--space-xs) var(--space-sm)',
                              color: 'var(--text-secondary)',
                            }}>
                              <span style={{ color: 'var(--accent-danger)' }}>●</span> {rec.category}: {rec.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </>
  );
}
