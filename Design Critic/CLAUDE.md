# Design Crit Tracker

Herramienta web para estructurar, evaluar y dar seguimiento al feedback recibido durante sesiones de design critique en equipos UX/UI.

## Como correr el proyecto

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173` por defecto.

### Build de produccion

```bash
npm run build
npm run preview
```

## Arquitectura

```
src/
  context/       → AuthContext (login/roles), DataContext (CRUD de datos)
  pages/         → ProfileSelectPage, SessionListPage, NewSessionPage, SessionDetailPage, DashboardPage
  components/
    layout/      → AppShell, Sidebar
    profile/     → ProfileCard
    session/     → SessionCard
    feedback/    → FeedbackForm, FeedbackList, FeedbackCard
    dor/         → DoRScoreCard, DoRChecklist
    dashboard/   → LeaderGlobalDashboard, LeaderDesignerDashboard, SessionDashboard, DesignerPersonalDashboard
    common/      → Button, Modal, Toast, EmptyState
  services/      → storageService (facade), localStorageService, googleSheetsService, dorScoringService
  utils/         → constants, dorKeywords, formatters, validators, animations
  styles/        → variables.css (theme tokens), global.css
```

## Roles y visibilidad

### Lider (jefa)
- Crea sesiones, selecciona presentadores, cierra sesiones
- Ve TODO: feedback de todos, scores de todos, comparaciones
- Dashboard global con ranking, alertas inteligentes, drill-down por disenador y por sesion

### Disenador que presenta
- Ve feedback recibido de TODOS los evaluadores hacia el/ella
- Ve feedback que el/ella dio a otros (separado en "Feedback recibido" y "Feedback realizado")
- Ve SOLO SU PROPIO score DoR
- Dashboard personal con evolucion, breakdown por categoria, issues recurrentes, recomendaciones
- NO ve ranking de otros, ni scores de otros, ni comparaciones

### Evaluador (no presenta en esa sesion)
- Solo puede evaluar a quienes presentan
- Solo puede ver SU PROPIO feedback dado
- NO puede ver feedback de otros evaluadores
- NO puede ver score DoR de nadie

## Flujo de una sesion

1. Lider crea sesion → selecciona presentadores (solo titulo, sin campo "proyecto")
2. Presentadores agregan su link de Figma
3. Disenadores entran y evaluan a otros (no a si mismos)
4. El sistema calcula el score DoR automaticamente basado en keywords
5. Lider cierra la sesion → scores finales calculados

## Logica del Checklist DoR

El motor de scoring se basa en `utils/dorKeywords.js` y `services/dorScoringService.js`.

### Como funciona

1. Cada item del DoR tiene un set de **keywords** asociadas
2. Cuando se agrega feedback, el texto del comentario + subcategoria se analizan contra esas keywords
3. Si una keyword negativa se encuentra → el item del checklist se marca como **fail** (❌)
4. Si hay feedback en la categoria pero sin keywords negativas → **pass** (✅)
5. Si no hay feedback en esa categoria → **unreviewed** (⚠️)

### Deteccion por keywords - Ejemplos

| Texto del feedback | Keyword detectada | Regla afectada |
|---|---|---|
| "El flujo esta confuso" | "flujo confuso" | ux_flow_complete → FAIL |
| "Falta el estado vacio" | "estado vacio" | ux_empty_state → FAIL |
| "Navegacion confusa, no se donde ir" | "navegacion confusa" | ux_navigation → FAIL |
| "Placeholder en el titulo" | "placeholder" | content_complete → FAIL |
| "Inconsistencia visual en botones" | "inconsistencia visual" | ui_consistency → FAIL |

### Categorias DoR (23 items total)

- **UX** (8 items): flujo completo, navegacion, estados (vacio, error, loading, exito), edge cases
- **UI** (7 items): componentes existentes, tipografia, espaciado, consistencia, estados de componentes
- **Contenido** (4 items): textos completos, mensajes de error, tono, claridad
- **Prototipo** (4 items): navegable, interacciones, anotaciones, organizacion

### Score

- `score = (items pass / items revisados) * 100`
- `coverage = (items revisados / items totales) * 100`
- Los items "unreviewed" no afectan el score, pero si la cobertura

### Como extender reglas

Editar `src/utils/dorKeywords.js`:

```javascript
export const DOR_RULES = {
  mi_nueva_regla: {
    id: 'mi_nueva_regla',
    category: 'UX',              // UX | UI | Contenido | Prototipo
    label: 'Descripcion del item',
    keywords: ['keyword1', 'keyword2'],  // keywords en minuscula
    negativeImpact: true,        // true = la keyword indica problema
  },
};
```

Las recomendaciones automaticas se definen en `dorScoringService.js` funcion `getRecommendationAction()`.

## Dashboards

### Dashboard Global (Lider)
Componente: `LeaderGlobalDashboard.jsx`
- KPIs: total sesiones, feedback promedio por sesion, score DoR promedio, issues recurrentes
- Grafica de evolucion del score del equipo por sesion
- Distribucion de feedback por categoria (pie chart)
- Ranking de disenadores con score, mejora y barra visual (clickable → drill-down)
- Issues recurrentes del equipo
- Alertas inteligentes (no mejora en 3+ sesiones, score bajo, mejora rapida)
- Historial de sesiones cerradas (clickable → drill-down a sesion)

### Dashboard por Disenador (Lider, drill-down)
Componente: `LeaderDesignerDashboard.jsx`
- Evolucion del score por sesion (grafica)
- Breakdown por categoria (UX, UI, Contenido, Prototipo)
- Fortalezas detectadas (categorias con score >= 70%)
- Issues recurrentes personales
- Insights automaticos (mejoro en X, bajo en Y)

### Dashboard por Sesion (Lider, drill-down)
Componente: `SessionDashboard.jsx`
- Resumen: fecha, presentadores, evaluadores
- Score por disenador en esa sesion (bar chart)
- Breakdown por categoria por disenador
- Issues detectados en esa sesion
- Feedback mas repetido (por subcategoria)
- Recomendaciones generadas

### Dashboard Personal (Disenador)
Componente: `DesignerPersonalDashboard.jsx`
- Mi rendimiento: promedio general + grafica de evolucion
- Breakdown personal por categoria
- Insights automaticos
- Issues recurrentes personales
- Recomendaciones
- Historial de sesiones (expandible con detalle: feedback recibido, score, problemas)

**Restriccion**: disenadores NO ven ranking, scores de otros, ni comparaciones.

## Conexion a Google Sheets

### Configuracion

1. Crear un Google Sheet con 3 hojas: `Sessions`, `Feedback`, `Designers`
2. Crear un Google Apps Script con endpoints POST/GET
3. Desplegar como Web App
4. En la app, pegar la URL del script en la configuracion (se guarda en localStorage como `dcr_backend_config`)

### Como funciona

- `storageService.js` actua como facade
- Si hay URL de Google Sheets configurada → usa `googleSheetsService.js`
- Si no → usa `localStorageService.js` (localStorage del navegador)
- Ambos implementan la misma interfaz: getSessions, createSession, getFeedback, etc.

### Estructura del Google Sheet

**Hoja Sessions**: sessionId, title, status, createdAt, closedAt, dorScore, createdBy, presenters (JSON)

**Hoja Feedback**: feedbackId, sessionId, evaluatedId, evaluatorId, category, subcategory, severity, comment, createdAt

**Hoja Designers**: designerId, name, avatar, role

### Google Apps Script ejemplo

El script debe exponer `doPost(e)` que parsea `JSON.parse(e.postData.contents)` y rutea por `action`:
- `getSessions`, `getSession`, `createSession`, `updateSession`, `deleteSession`
- `getAllFeedback`, `getFeedback`, `createFeedback`, `updateFeedback`, `deleteFeedback`
- `getDesigners`, `getDesigner`, `updateDesigner`

## Stack tecnico

- React 19 + Vite
- react-router-dom (routing)
- framer-motion (animaciones)
- recharts (graficas del dashboard)
- CSS Modules + CSS custom properties (dark theme)
- localStorage como storage por defecto
- Google Sheets como storage opcional
