import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { scoreFeedback, getOverallScore, getCategoryScores, getRecommendations } from '../services/dorScoringService';
import { SESSION_STATUS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import { validateFigmaLink } from '../utils/validators';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackList from '../components/feedback/FeedbackList';
import DoRScoreCard from '../components/dor/DoRScoreCard';
import DoRChecklist from '../components/dor/DoRChecklist';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import styles from './SessionDetailPage.module.css';

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isLeader } = useAuth();
  const { sessions, editSession, getSessionFeedback } = useData();
  const { addToast } = useToast();

  const session = sessions.find(s => s.id === id);
  const allSessionFeedback = getSessionFeedback(id);

  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [figmaLink, setFigmaLink] = useState('');
  const [figmaPresenter, setFigmaPresenter] = useState(null);
  const [activeTab, setActiveTab] = useState('feedback');

  // Determine user's role in this session
  const isPresenter = session?.presenters?.some(p => p.id === currentUser.id);
  const isEvaluator = !isPresenter && !isLeader;

  /*
   * VISIBILITY RULES:
   * - Leader: sees ALL feedback and ALL DoR scores
   * - Presenter: sees feedback RECEIVED (from all evaluators to them) + feedback they GAVE to others + their OWN DoR score only
   * - Evaluator (not presenting): sees ONLY their own feedback given, NO DoR scores
   */
  const visibleFeedback = useMemo(() => {
    if (isLeader) return allSessionFeedback;
    if (isPresenter) {
      // Feedback received (evaluated = me) + feedback I gave (evaluator = me)
      return allSessionFeedback.filter(
        f => f.evaluatedId === currentUser.id || f.evaluatorId === currentUser.id
      );
    }
    // Evaluator: only their own feedback given
    return allSessionFeedback.filter(f => f.evaluatorId === currentUser.id);
  }, [allSessionFeedback, isLeader, isPresenter, currentUser.id]);

  // Split feedback for presenters into received vs given
  const feedbackReceived = useMemo(() => {
    if (!isPresenter) return [];
    return allSessionFeedback.filter(f => f.evaluatedId === currentUser.id);
  }, [allSessionFeedback, isPresenter, currentUser.id]);

  const feedbackGiven = useMemo(() => {
    return allSessionFeedback.filter(f => f.evaluatorId === currentUser.id);
  }, [allSessionFeedback, currentUser.id]);

  // DoR scoring - only for leader (any presenter) or presenter (own only)
  const canViewDoR = isLeader || isPresenter;

  const dorResults = useMemo(() => {
    if (!canViewDoR || !selectedPresenter) return null;
    // Presenters can only see their OWN DoR score
    if (isPresenter && selectedPresenter.id !== currentUser.id) return null;
    const presenterFeedback = allSessionFeedback.filter(f => f.evaluatedId === selectedPresenter.id);
    return scoreFeedback(presenterFeedback);
  }, [allSessionFeedback, selectedPresenter, canViewDoR, isPresenter, currentUser.id]);

  const overallScore = useMemo(() => {
    if (!dorResults) return null;
    return getOverallScore(dorResults);
  }, [dorResults]);

  const categoryScores = useMemo(() => {
    if (!dorResults) return null;
    return getCategoryScores(dorResults);
  }, [dorResults]);

  const recommendations = useMemo(() => {
    if (!dorResults) return [];
    return getRecommendations(dorResults);
  }, [dorResults]);

  // Presenters available for DoR selection
  const dorPresenters = useMemo(() => {
    if (isLeader) return session?.presenters || [];
    if (isPresenter) return session?.presenters?.filter(p => p.id === currentUser.id) || [];
    return [];
  }, [session, isLeader, isPresenter, currentUser.id]);

  if (!session) {
    return (
      <div className={styles.notFound}>
        <h2>Sesion no encontrada</h2>
        <Button variant="secondary" onClick={() => navigate('/sessions')}>
          Volver a sesiones
        </Button>
      </div>
    );
  }

  const isOpen = session.status !== SESSION_STATUS.CLOSED;
  const canEvaluate = (presenter) => {
    return isOpen && currentUser.id !== presenter.id;
  };

  const handleStartSession = async () => {
    await editSession(id, { status: SESSION_STATUS.IN_PROGRESS });
    addToast('Sesion iniciada', 'success');
  };

  const handleCloseSession = async () => {
    const presenterScores = {};
    for (const presenter of session.presenters) {
      const pFeedback = allSessionFeedback.filter(f => f.evaluatedId === presenter.id);
      const results = scoreFeedback(pFeedback);
      const score = getOverallScore(results);
      presenterScores[presenter.id] = score.score;
    }

    const avgScore = Object.values(presenterScores).length > 0
      ? Object.values(presenterScores).reduce((a, b) => a + b, 0) / Object.values(presenterScores).length
      : 0;

    await editSession(id, {
      status: SESSION_STATUS.CLOSED,
      closedAt: new Date().toISOString(),
      dorScore: avgScore,
      presenterScores,
    });
    addToast('Sesion cerrada. Scores calculados.', 'success');
  };

  const handleAddFigmaLink = async () => {
    const error = validateFigmaLink(figmaLink);
    if (error) {
      addToast(error, 'error');
      return;
    }

    const updatedPresenters = session.presenters.map(p =>
      p.id === figmaPresenter.id ? { ...p, figmaLink } : p
    );
    await editSession(id, { presenters: updatedPresenters });
    addToast('Link de Figma guardado', 'success');
    setShowFigmaModal(false);
    setFigmaLink('');
  };

  const openFeedbackForm = (presenter) => {
    if (!canEvaluate(presenter)) return;
    setSelectedPresenter(presenter);
    setShowFeedbackForm(true);
  };

  // Build tabs based on role
  const tabs = [];
  if (isLeader) {
    tabs.push({ id: 'feedback', label: `Feedback (${visibleFeedback.length})` });
    tabs.push({ id: 'dor', label: 'DoR Score' });
  } else if (isPresenter) {
    tabs.push({ id: 'received', label: `Feedback recibido (${feedbackReceived.length})` });
    tabs.push({ id: 'given', label: `Feedback realizado (${feedbackGiven.length})` });
    tabs.push({ id: 'dor', label: 'Mi DoR Score' });
  } else {
    // Evaluator
    tabs.push({ id: 'given', label: `Mi feedback (${feedbackGiven.length})` });
  }

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div>
          <button className={styles.back} onClick={() => navigate('/sessions')}>
            ← Volver
          </button>
          <h1 className={styles.title}>{session.title}</h1>
          <div className={styles.meta}>
            <span className={styles.date}>{formatDate(session.createdAt)}</span>
            <span className={`${styles.status} ${styles[session.status]}`}>
              {session.status === 'open' ? '🟢 Abierta' :
               session.status === 'in_progress' ? '🟡 En curso' : '⚪ Cerrada'}
            </span>
          </div>
        </div>

        {isLeader && isOpen && (
          <div className={styles.headerActions}>
            {session.status === SESSION_STATUS.OPEN && (
              <Button variant="accent" onClick={handleStartSession}>
                Iniciar Sesion
              </Button>
            )}
            {session.status === SESSION_STATUS.IN_PROGRESS && (
              <Button variant="danger" onClick={handleCloseSession}>
                Cerrar Sesion
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Presenters */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Presentadores</h2>
        <div className={styles.presenterGrid}>
          {session.presenters?.map(presenter => {
            const presenterFeedbackCount = allSessionFeedback.filter(f => f.evaluatedId === presenter.id).length;
            const isCurrentUser = currentUser.id === presenter.id;
            const canRate = canEvaluate(presenter);

            return (
              <motion.div
                key={presenter.id}
                className={`${styles.presenterCard} ${isCurrentUser ? styles.self : ''} ${canRate ? styles.canRate : ''}`}
                whileHover={canRate ? { scale: 1.03 } : {}}
                onClick={() => {
                  if (canRate) openFeedbackForm(presenter);
                  else setSelectedPresenter(presenter);
                }}
              >
                <div className={styles.presenterHeader}>
                  <span className={styles.presenterAvatar}>{presenter.avatar}</span>
                  <div>
                    <h3 className={styles.presenterName}>{presenter.name}</h3>
                    {isCurrentUser && <span className={styles.youBadge}>Tu</span>}
                  </div>
                </div>

                {presenter.figmaLink ? (
                  <a
                    href={presenter.figmaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.figmaLink}
                    onClick={e => e.stopPropagation()}
                  >
                    🔗 Ver en Figma
                  </a>
                ) : (
                  isCurrentUser && isOpen && (
                    <button
                      className={styles.addFigma}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFigmaPresenter(presenter);
                        setShowFigmaModal(true);
                      }}
                    >
                      + Agregar link Figma
                    </button>
                  )
                )}

                <div className={styles.feedbackCount}>
                  {isLeader
                    ? `${presenterFeedbackCount} feedback${presenterFeedbackCount !== 1 ? 's' : ''}`
                    : canRate
                      ? 'Click para evaluar'
                      : isCurrentUser
                        ? `${presenterFeedbackCount} feedback${presenterFeedbackCount !== 1 ? 's' : ''} recibidos`
                        : ''
                  }
                </div>

                {canRate && (
                  <span className={styles.rateLabel}>Click para evaluar</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'dor') {
                if (isPresenter) {
                  const me = session.presenters?.find(p => p.id === currentUser.id);
                  if (me) setSelectedPresenter(me);
                } else if (!selectedPresenter && session.presenters?.length > 0) {
                  setSelectedPresenter(session.presenters[0]);
                }
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content: All feedback (leader) */}
      {activeTab === 'feedback' && isLeader && (
        <section className={styles.section}>
          <FeedbackList
            feedback={visibleFeedback}
            presenters={session.presenters}
            selectedPresenter={selectedPresenter}
            onSelectPresenter={setSelectedPresenter}
          />
        </section>
      )}

      {/* Tab content: Feedback received (presenter) */}
      {activeTab === 'received' && isPresenter && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Feedback que recibiste</h3>
          <FeedbackList
            feedback={feedbackReceived}
            presenters={session.presenters}
            selectedPresenter={session.presenters?.find(p => p.id === currentUser.id) || null}
            onSelectPresenter={() => {}}
          />
        </section>
      )}

      {/* Tab content: Feedback given (presenter or evaluator) */}
      {activeTab === 'given' && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Feedback que realizaste</h3>
          <FeedbackList
            feedback={feedbackGiven}
            presenters={session.presenters}
            selectedPresenter={null}
            onSelectPresenter={() => {}}
          />
        </section>
      )}

      {/* Tab content: DoR Score (leader or presenter for own score) */}
      {activeTab === 'dor' && canViewDoR && (
        <section className={styles.section}>
          {/* Presenter selector for DoR */}
          {dorPresenters.length > 1 && (
            <div className={styles.dorPresenterSelect}>
              {dorPresenters.map(p => (
                <button
                  key={p.id}
                  className={`${styles.dorPresenterBtn} ${selectedPresenter?.id === p.id ? styles.dorPresenterActive : ''}`}
                  onClick={() => setSelectedPresenter(p)}
                >
                  {p.avatar} {p.name}
                </button>
              ))}
            </div>
          )}

          {selectedPresenter && dorResults ? (
            <div className={styles.dorGrid}>
              <DoRScoreCard score={overallScore} categoryScores={categoryScores} />
              <DoRChecklist results={dorResults} recommendations={recommendations} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              {isPresenter
                ? 'Selecciona la pestaña para ver tu score DoR'
                : 'Selecciona un presentador para ver su score DoR'}
            </p>
          )}
        </section>
      )}

      {/* Feedback Form Modal */}
      <Modal
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        title={`Evaluar a ${selectedPresenter?.name}`}
        size="lg"
      >
        <FeedbackForm
          sessionId={id}
          evaluatedId={selectedPresenter?.id}
          evaluatedName={selectedPresenter?.name}
          evaluatorId={currentUser.id}
          onClose={() => setShowFeedbackForm(false)}
        />
      </Modal>

      {/* Figma Link Modal */}
      <Modal
        isOpen={showFigmaModal}
        onClose={() => setShowFigmaModal(false)}
        title="Agregar link de Figma"
        size="sm"
      >
        <div className={styles.figmaForm}>
          <label className={styles.figmaLabel}>Link de Figma (obligatorio)</label>
          <input
            type="url"
            value={figmaLink}
            onChange={e => setFigmaLink(e.target.value)}
            placeholder="https://figma.com/design/..."
          />
          <div className={styles.figmaActions}>
            <Button variant="ghost" onClick={() => setShowFigmaModal(false)}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={handleAddFigmaLink}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
