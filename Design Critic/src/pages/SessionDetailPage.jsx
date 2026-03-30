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
  const feedback = getSessionFeedback(id);

  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [figmaLink, setFigmaLink] = useState('');
  const [figmaPresenter, setFigmaPresenter] = useState(null);
  const [activeTab, setActiveTab] = useState('feedback');

  // DoR scoring
  const dorResults = useMemo(() => {
    if (!selectedPresenter) return null;
    const presenterFeedback = feedback.filter(f => f.evaluatedId === selectedPresenter.id);
    return scoreFeedback(presenterFeedback);
  }, [feedback, selectedPresenter]);

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

  if (!session) {
    return (
      <div className={styles.notFound}>
        <h2>Sesión no encontrada</h2>
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
    addToast('Sesión iniciada', 'success');
  };

  const handleCloseSession = async () => {
    // Calculate final DoR scores for each presenter
    const presenterScores = {};
    for (const presenter of session.presenters) {
      const pFeedback = feedback.filter(f => f.evaluatedId === presenter.id);
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
    addToast('Sesión cerrada. Scores calculados.', 'success');
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
            {session.project && <span className={styles.project}>{session.project}</span>}
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
                Iniciar Sesión
              </Button>
            )}
            {session.status === SESSION_STATUS.IN_PROGRESS && (
              <Button variant="danger" onClick={handleCloseSession}>
                Cerrar Sesión
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
            const presenterFeedback = feedback.filter(f => f.evaluatedId === presenter.id);
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
                    {isCurrentUser && <span className={styles.youBadge}>Tú</span>}
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
                  {presenterFeedback.length} feedback{presenterFeedback.length !== 1 ? 's' : ''}
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
        <button
          className={`${styles.tab} ${activeTab === 'feedback' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback ({feedback.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'dor' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('dor');
            if (!selectedPresenter && session.presenters?.length > 0) {
              setSelectedPresenter(session.presenters[0]);
            }
          }}
        >
          DoR Score
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'feedback' && (
        <section className={styles.section}>
          <FeedbackList
            feedback={feedback}
            presenters={session.presenters}
            selectedPresenter={selectedPresenter}
            onSelectPresenter={setSelectedPresenter}
          />
        </section>
      )}

      {activeTab === 'dor' && selectedPresenter && (
        <section className={styles.section}>
          {/* Presenter selector for DoR */}
          <div className={styles.dorPresenterSelect}>
            {session.presenters?.map(p => (
              <button
                key={p.id}
                className={`${styles.dorPresenterBtn} ${selectedPresenter?.id === p.id ? styles.dorPresenterActive : ''}`}
                onClick={() => setSelectedPresenter(p)}
              >
                {p.avatar} {p.name}
              </button>
            ))}
          </div>

          <div className={styles.dorGrid}>
            <DoRScoreCard score={overallScore} categoryScores={categoryScores} />
            <DoRChecklist results={dorResults} recommendations={recommendations} />
          </div>
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
