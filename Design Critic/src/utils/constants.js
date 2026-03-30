export const ROLES = {
  LEADER: 'leader',
  DESIGNER: 'designer',
};

export const SESSION_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
};

export const CATEGORIES = {
  UX: 'UX',
  UI: 'UI',
  CONTENT: 'Contenido',
  PROTOTYPE: 'Prototipo',
};

export const SUBCATEGORIES = {
  [CATEGORIES.UX]: [
    'Flujo incompleto',
    'Navegación confusa',
    'Estados faltantes',
    'Edge cases',
    'Pantallas duplicadas',
  ],
  [CATEGORIES.UI]: [
    'Inconsistencia visual',
    'Tipografía',
    'Espaciado',
    'Componentes incorrectos',
    'Estados de componentes',
    'Colores',
  ],
  [CATEGORIES.CONTENT]: [
    'Copy confuso',
    'Placeholders',
    'Mensajes de error',
    'Tono inconsistente',
  ],
  [CATEGORIES.PROTOTYPE]: [
    'No navegable',
    'Interacciones faltantes',
    'Organización en Figma',
    'Anotaciones faltantes',
  ],
};

export const SEVERITY = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export const SEVERITY_COLORS = {
  [SEVERITY.LOW]: 'var(--severity-low)',
  [SEVERITY.MEDIUM]: 'var(--severity-medium)',
  [SEVERITY.HIGH]: 'var(--severity-high)',
};

export const CATEGORY_COLORS = {
  [CATEGORIES.UX]: 'var(--cat-ux)',
  [CATEGORIES.UI]: 'var(--cat-ui)',
  [CATEGORIES.CONTENT]: 'var(--cat-content)',
  [CATEGORIES.PROTOTYPE]: 'var(--cat-prototype)',
};

export const DEFAULT_DESIGNERS = [
  { id: '1', name: 'Michelle', avatar: '🎨', role: ROLES.DESIGNER },
  { id: '2', name: 'Samuel', avatar: '🖌️', role: ROLES.DESIGNER },
  { id: '3', name: 'Ericka', avatar: '✏️', role: ROLES.DESIGNER },
  { id: '4', name: 'Victor', avatar: '🎯', role: ROLES.DESIGNER },
  { id: '5', name: 'Juan Carlos', avatar: '💎', role: ROLES.DESIGNER },
  { id: '6', name: 'Alex', avatar: '🚀', role: ROLES.DESIGNER },
];

export const LEADER_PROFILE = {
  id: 'leader-1',
  name: 'Analí',
  avatar: '👑',
  role: ROLES.LEADER,
};

export const STORAGE_KEYS = {
  SESSIONS: 'dcr_sessions',
  FEEDBACK: 'dcr_feedback',
  DESIGNERS: 'dcr_designers',
  CURRENT_USER: 'dcr_current_user',
  BACKEND_CONFIG: 'dcr_backend_config',
};
