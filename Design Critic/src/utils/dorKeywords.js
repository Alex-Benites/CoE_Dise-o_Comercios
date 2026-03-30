// ============================================================
// DoR KEYWORD MAPPINGS - Mapeo de keywords a items del checklist
// ============================================================
//
// Cada regla tiene:
//   id: identificador unico de la regla
//   category: UX | UI | Contenido | Prototipo
//   label: descripcion legible del item del checklist
//   keywords: array de palabras/frases que se buscan en el texto del feedback (en minuscula)
//   negativeImpact: true = si se encuentra la keyword, el item se marca como FAIL
//
// COMO SE DETECTAN PROBLEMAS:
//   El motor combina: comment + subcategory del feedback
//   Convierte todo a minuscula
//   Busca cada keyword en el texto combinado
//
// Ejemplos de deteccion:
//   Feedback: "El flujo esta confuso, no se entiende como llegar al checkout"
//   → Detecta: "confuso" → content_clarity FAIL
//   → Detecta: "flujo confuso" → ux_flow_complete FAIL (si esta keyword esta definida)
//
//   Feedback: "Falta el estado vacio cuando no hay resultados"
//   → Detecta: "estado vacio" → ux_empty_state FAIL
//
// PARA AGREGAR NUEVAS REGLAS:
//   1. Agregar un nuevo objeto con id unico
//   2. Definir las keywords mas representativas del problema
//   3. Agregar la recomendacion correspondiente en dorScoringService.js
// ============================================================

export const DOR_RULES = {
  // === UX ===
  ux_flow_complete: {
    id: 'ux_flow_complete',
    category: 'UX',
    label: 'El flujo está completo y claro',
    keywords: [
      'flujo incompleto', 'flujo confuso', 'falta paso', 'pantalla faltante',
      'no se entiende el flujo', 'sin flujo', 'faltan pantallas',
    ],
    negativeImpact: true,
  },
  ux_no_duplicates: {
    id: 'ux_no_duplicates',
    category: 'UX',
    label: 'No hay pantallas incompletas, duplicadas o faltantes',
    keywords: [
      'pantalla duplicada', 'duplicado', 'pantalla incompleta',
      'pantalla repetida', 'falta pantalla',
    ],
    negativeImpact: true,
  },
  ux_empty_state: {
    id: 'ux_empty_state',
    category: 'UX',
    label: 'Estado vacío contemplado',
    keywords: [
      'estado vacío', 'empty state', 'sin datos', 'no hay contenido',
      'falta estado vacío', 'vacío',
    ],
    negativeImpact: true,
  },
  ux_error_state: {
    id: 'ux_error_state',
    category: 'UX',
    label: 'Estado de error contemplado',
    keywords: [
      'estado de error', 'falta error', 'sin error', 'error state',
      'no tiene error', 'falta estado de error',
    ],
    negativeImpact: true,
  },
  ux_loading_state: {
    id: 'ux_loading_state',
    category: 'UX',
    label: 'Estado de loading contemplado',
    keywords: [
      'loading', 'cargando', 'falta loading', 'sin loading',
      'estado de carga', 'skeleton',
    ],
    negativeImpact: true,
  },
  ux_success_state: {
    id: 'ux_success_state',
    category: 'UX',
    label: 'Estado de éxito/confirmación contemplado',
    keywords: [
      'confirmación', 'éxito', 'falta confirmación', 'sin éxito',
      'success state', 'falta éxito',
    ],
    negativeImpact: true,
  },
  ux_edge_cases: {
    id: 'ux_edge_cases',
    category: 'UX',
    label: 'Edge cases considerados',
    keywords: [
      'edge case', 'caso borde', 'caso extremo', 'escenario',
      'no contempla', 'falta escenario',
    ],
    negativeImpact: true,
  },
  ux_navigation: {
    id: 'ux_navigation',
    category: 'UX',
    label: 'Navegación lógica entre pantallas',
    keywords: [
      'navegación confusa', 'no se sabe dónde ir', 'perdido',
      'navegación', 'back', 'volver', 'ruta confusa',
    ],
    negativeImpact: true,
  },

  // === UI ===
  ui_existing_components: {
    id: 'ui_existing_components',
    category: 'UI',
    label: 'Uso de componentes existentes',
    keywords: [
      'componente nuevo', 'no usa design system', 'componente custom',
      'innecesario', 'componente diferente',
    ],
    negativeImpact: true,
  },
  ui_typography: {
    id: 'ui_typography',
    category: 'UI',
    label: 'Tipografía y colores siguen las guías',
    keywords: [
      'tipografía', 'fuente incorrecta', 'color incorrecto', 'colores',
      'fuente', 'font', 'tipo de letra',
    ],
    negativeImpact: true,
  },
  ui_spacing: {
    id: 'ui_spacing',
    category: 'UI',
    label: 'Espaciados y alineaciones consistentes',
    keywords: [
      'espaciado', 'alineación', 'desalineado', 'spacing', 'padding',
      'margen', 'grid', 'inconsistente',
    ],
    negativeImpact: true,
  },
  ui_consistency: {
    id: 'ui_consistency',
    category: 'UI',
    label: 'Iconos, botones y formularios consistentes',
    keywords: [
      'icono incorrecto', 'botón diferente', 'formulario inconsistente',
      'inconsistencia visual', 'inconsistente', 'no es consistente',
    ],
    negativeImpact: true,
  },
  ui_no_new_components: {
    id: 'ui_no_new_components',
    category: 'UI',
    label: 'No se crearon componentes innecesarios',
    keywords: [
      'componente innecesario', 'componente nuevo sin validar',
      'creó componente', 'nuevo componente',
    ],
    negativeImpact: true,
  },
  ui_component_states: {
    id: 'ui_component_states',
    category: 'UI',
    label: 'Estados de componentes contemplados (hover, disabled, error)',
    keywords: [
      'hover', 'disabled', 'falta estado', 'estado del componente',
      'sin hover', 'sin disabled',
    ],
    negativeImpact: true,
  },
  ui_no_visual_errors: {
    id: 'ui_no_visual_errors',
    category: 'UI',
    label: 'No hay errores visuales evidentes',
    keywords: [
      'error visual', 'bug visual', 'se ve mal', 'roto',
      'glitch', 'overflow', 'desborda',
    ],
    negativeImpact: true,
  },

  // === CONTENIDO ===
  content_complete: {
    id: 'content_complete',
    category: 'Contenido',
    label: 'Textos completos (sin placeholders)',
    keywords: [
      'placeholder', 'lorem ipsum', 'texto faltante', 'sin texto',
      'falta copy', 'texto placeholder',
    ],
    negativeImpact: true,
  },
  content_error_messages: {
    id: 'content_error_messages',
    category: 'Contenido',
    label: 'Mensajes de error o ayuda definidos',
    keywords: [
      'mensaje de error', 'falta mensaje', 'sin mensaje de ayuda',
      'tooltip', 'help text', 'ayuda',
    ],
    negativeImpact: true,
  },
  content_tone: {
    id: 'content_tone',
    category: 'Contenido',
    label: 'Tono del contenido consistente',
    keywords: [
      'tono', 'voz', 'inconsistente el texto', 'lenguaje diferente',
      'tono diferente', 'voz diferente',
    ],
    negativeImpact: true,
  },
  content_clarity: {
    id: 'content_clarity',
    category: 'Contenido',
    label: 'Etiquetas, botones y mensajes claros',
    keywords: [
      'no se entiende', 'confuso', 'ambiguo', 'label confuso',
      'botón confuso', 'CTA confuso', 'no es claro',
    ],
    negativeImpact: true,
  },

  // === PROTOTIPO ===
  proto_updated: {
    id: 'proto_updated',
    category: 'Prototipo',
    label: 'Prototipo actualizado y navegable en Figma',
    keywords: [
      'prototipo roto', 'no navega', 'no se puede navegar',
      'prototipo desactualizado', 'links rotos',
    ],
    negativeImpact: true,
  },
  proto_interactions: {
    id: 'proto_interactions',
    category: 'Prototipo',
    label: 'Interacciones principales definidas',
    keywords: [
      'falta interacción', 'sin interacción', 'interacción',
      'animación faltante', 'transición',
    ],
    negativeImpact: true,
  },
  proto_annotations: {
    id: 'proto_annotations',
    category: 'Prototipo',
    label: 'Anotaciones incluidas cuando necesario',
    keywords: [
      'falta anotación', 'sin nota', 'sin especificación',
      'anotación', 'nota', 'spec',
    ],
    negativeImpact: true,
  },
  proto_organization: {
    id: 'proto_organization',
    category: 'Prototipo',
    label: 'Componentes organizados en Figma',
    keywords: [
      'desordenado', 'desorganizado', 'organización',
      'capas desordenadas', 'naming',
    ],
    negativeImpact: true,
  },
};

export const DOR_CATEGORIES = ['UX', 'UI', 'Contenido', 'Prototipo'];

export function getRulesByCategory(category) {
  return Object.values(DOR_RULES).filter(rule => rule.category === category);
}
