import { DOR_RULES, DOR_CATEGORIES, getRulesByCategory } from '../utils/dorKeywords';

/**
 * ============================================================
 * MOTOR DE SCORING DoR (Definition of Ready)
 * ============================================================
 *
 * Este servicio analiza el feedback textual contra 23 reglas del DoR
 * para determinar automaticamente la "readiness" de un diseno.
 *
 * COMO FUNCIONA EL CHECKLIST:
 * Cada item del checklist se marca como:
 *   - ✅ pass     → La categoria tiene feedback pero SIN keywords negativas detectadas
 *   - ❌ fail     → Se detecto una keyword negativa en el texto del feedback
 *   - ⚠️ unreviewed → No hay feedback en esa categoria (sin evaluar)
 *
 * DETECCION POR KEYWORDS:
 * El sistema combina el comentario + subcategoria del feedback y busca
 * coincidencias contra las keywords definidas en dorKeywords.js.
 *
 * Ejemplos de deteccion:
 *   - "error", "estado de error" → problema en estados de error (ux_error_state)
 *   - "confuso", "no se entiende" → problema de claridad (content_clarity)
 *   - "navegacion confusa", "perdido" → problema de navegacion (ux_navigation)
 *   - "inconsistente", "desalineado" → problema visual (ui_spacing, ui_consistency)
 *   - "placeholder", "lorem ipsum" → contenido incompleto (content_complete)
 *
 * CALCULO DEL SCORE:
 *   score = (items pass / items revisados) * 100
 *   coverage = (items revisados / 23 items totales) * 100
 *   Items "unreviewed" NO afectan el score, pero SI la cobertura.
 *
 * ============================================================
 */

/**
 * Analyzes feedback text against DoR keyword rules.
 * Returns per-item status and scores.
 *
 * Paso 1: Inicializa 23 reglas como 'unreviewed'
 * Paso 2: Por cada feedback, busca keywords negativas en texto
 * Paso 3: Si hay feedback en categoria sin keywords negativas → 'pass'
 */
export function scoreFeedback(feedbackItems) {
  const results = {};

  // Initialize all rules as 'unreviewed'
  for (const rule of Object.values(DOR_RULES)) {
    results[rule.id] = {
      ...rule,
      status: 'unreviewed', // pass | fail | unreviewed
      matchedFeedback: [],
    };
  }

  // Analyze each feedback item
  for (const item of feedbackItems) {
    const text = [
      item.comment || '',
      item.subcategory || '',
    ].join(' ').toLowerCase();

    for (const rule of Object.values(DOR_RULES)) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          results[rule.id].matchedFeedback.push({
            feedbackId: item.id,
            keyword,
            comment: item.comment,
          });

          if (rule.negativeImpact) {
            results[rule.id].status = 'fail';
          }
          break; // One match per rule per feedback item is enough
        }
      }
    }
  }

  // Mark rules that were reviewed but had no negative matches as 'pass'
  // A rule is considered reviewed if feedback in its category exists
  const feedbackCategories = new Set(feedbackItems.map(f => f.category));

  for (const rule of Object.values(DOR_RULES)) {
    if (results[rule.id].status === 'unreviewed') {
      // Map DoR categories to feedback categories
      const categoryMap = {
        'UX': 'UX',
        'UI': 'UI',
        'Contenido': 'Contenido',
        'Prototipo': 'Prototipo',
      };
      if (feedbackCategories.has(categoryMap[rule.category])) {
        results[rule.id].status = 'pass';
      }
    }
  }

  return results;
}

/**
 * Calculate score per DoR category
 */
export function getCategoryScores(results) {
  const scores = {};

  for (const category of DOR_CATEGORIES) {
    const rules = getRulesByCategory(category);
    const reviewed = rules.filter(r => results[r.id]?.status !== 'unreviewed');
    const passed = reviewed.filter(r => results[r.id]?.status === 'pass');

    scores[category] = {
      total: rules.length,
      reviewed: reviewed.length,
      passed: passed.length,
      failed: reviewed.length - passed.length,
      score: reviewed.length > 0 ? (passed.length / reviewed.length) * 100 : null,
      coverage: (reviewed.length / rules.length) * 100,
    };
  }

  return scores;
}

/**
 * Calculate overall DoR score
 */
export function getOverallScore(results) {
  const allRules = Object.values(DOR_RULES);
  const reviewed = allRules.filter(r => results[r.id]?.status !== 'unreviewed');
  const passed = reviewed.filter(r => results[r.id]?.status === 'pass');

  return {
    total: allRules.length,
    reviewed: reviewed.length,
    passed: passed.length,
    failed: reviewed.length - passed.length,
    score: reviewed.length > 0 ? (passed.length / reviewed.length) * 100 : 0,
    coverage: (reviewed.length / allRules.length) * 100,
  };
}

/**
 * Generate automatic recommendations based on failed rules
 */
export function getRecommendations(results) {
  const recommendations = [];
  const ruleResults = Object.values(results);

  const failedRules = ruleResults.filter(r => r.status === 'fail');

  for (const rule of failedRules) {
    recommendations.push({
      category: rule.category,
      label: rule.label,
      action: getRecommendationAction(rule.id),
      severity: rule.matchedFeedback.length > 1 ? 'Alta' : 'Media',
      matchCount: rule.matchedFeedback.length,
    });
  }

  // Sort by match count (more matches = more critical)
  return recommendations.sort((a, b) => b.matchCount - a.matchCount);
}

function getRecommendationAction(ruleId) {
  const actions = {
    ux_flow_complete: 'Revisa y completa el flujo de usuario. Asegúrate que cada paso esté claro.',
    ux_no_duplicates: 'Elimina pantallas duplicadas y completa las faltantes.',
    ux_empty_state: 'Diseña el estado vacío para las pantallas que muestran datos.',
    ux_error_state: 'Agrega estados de error para formularios y acciones que pueden fallar.',
    ux_loading_state: 'Incluye estados de loading/skeleton para contenido asíncrono.',
    ux_success_state: 'Agrega pantallas o mensajes de confirmación de éxito.',
    ux_edge_cases: 'Considera escenarios extremos y edge cases del flujo.',
    ux_navigation: 'Mejora la navegación entre pantallas. Asegura rutas claras de ida y vuelta.',
    ui_existing_components: 'Prioriza componentes del design system existente.',
    ui_typography: 'Revisa tipografía y colores contra las guías visuales.',
    ui_spacing: 'Corrige espaciados y alineaciones según la grid del producto.',
    ui_consistency: 'Unifica el estilo visual de iconos, botones y formularios.',
    ui_no_new_components: 'Valida con el equipo antes de crear componentes nuevos.',
    ui_component_states: 'Define estados hover, disabled y error para cada componente.',
    ui_no_visual_errors: 'Corrige los errores visuales detectados.',
    content_complete: 'Reemplaza todos los placeholders con textos finales.',
    content_error_messages: 'Define mensajes de error y textos de ayuda.',
    content_tone: 'Revisa que el tono sea consistente con el producto.',
    content_clarity: 'Mejora la claridad de etiquetas, botones y CTAs.',
    proto_updated: 'Actualiza el prototipo en Figma y verifica que sea navegable.',
    proto_interactions: 'Define las interacciones principales del prototipo.',
    proto_annotations: 'Agrega anotaciones donde el comportamiento no sea evidente.',
    proto_organization: 'Organiza las capas y componentes en Figma.',
  };
  return actions[ruleId] || 'Revisa este aspecto del diseño.';
}

/**
 * Detect recurring issues across sessions for a designer
 */
export function detectRecurringIssues(sessionResults) {
  const issueFrequency = {};

  for (const { sessionId, sessionTitle, results, date } of sessionResults) {
    const failedRules = Object.values(results).filter(r => r.status === 'fail');

    for (const rule of failedRules) {
      if (!issueFrequency[rule.id]) {
        issueFrequency[rule.id] = {
          ruleId: rule.id,
          category: rule.category,
          label: rule.label,
          sessions: [],
          count: 0,
        };
      }
      issueFrequency[rule.id].sessions.push({ sessionId, sessionTitle, date });
      issueFrequency[rule.id].count++;
    }
  }

  // Return only issues that appear in more than one session
  return Object.values(issueFrequency)
    .filter(issue => issue.count > 1)
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate insights based on session history
 */
export function generateInsights(sessionResults) {
  const insights = [];

  if (sessionResults.length < 2) return insights;

  const latest = sessionResults[0];
  const previous = sessionResults[1];

  // Compare overall scores
  const latestScore = getOverallScore(latest.results);
  const previousScore = getOverallScore(previous.results);

  if (latestScore.score > previousScore.score) {
    insights.push({
      type: 'positive',
      message: `Mejoraste tu score DoR de ${Math.round(previousScore.score)}% a ${Math.round(latestScore.score)}%`,
    });
  } else if (latestScore.score < previousScore.score) {
    insights.push({
      type: 'warning',
      message: `Tu score DoR bajó de ${Math.round(previousScore.score)}% a ${Math.round(latestScore.score)}%`,
    });
  }

  // Check category-specific trends
  const latestCat = getCategoryScores(latest.results);
  const previousCat = getCategoryScores(previous.results);

  for (const category of DOR_CATEGORIES) {
    const curr = latestCat[category]?.score;
    const prev = previousCat[category]?.score;
    if (curr !== null && prev !== null) {
      if (curr > prev + 20) {
        insights.push({
          type: 'positive',
          message: `Gran mejora en ${category}: subiste de ${Math.round(prev)}% a ${Math.round(curr)}%`,
        });
      }
    }
  }

  // Recurring issues warning
  const recurring = detectRecurringIssues(sessionResults);
  if (recurring.length > 0) {
    const top = recurring[0];
    insights.push({
      type: 'alert',
      message: `"${top.label}" ha sido un problema en ${top.count} sesiones consecutivas`,
    });
  }

  return insights;
}
