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
  components/    → layout/, profile/, session/, feedback/, dor/, dashboard/, common/
  services/      → storageService (facade), localStorageService, googleSheetsService, dorScoringService
  utils/         → constants, dorKeywords, formatters, validators, animations
  styles/        → variables.css (theme tokens), global.css
```

## Roles

- **Lider**: crea sesiones, selecciona presentadores, ve metricas del equipo completo, cierra sesiones
- **Disenador**: ve sesiones activas, evalua a otros (NO a si mismo), ve su propio dashboard y feedback

## Flujo de una sesion

1. Lider crea sesion → selecciona presentadores
2. Presentadores agregan su link de Figma (obligatorio)
3. Disenadores entran y evaluan a otros (no a si mismos)
4. El sistema calcula el score DoR automaticamente basado en keywords
5. Lider cierra la sesion → scores finales calculados

## Logica del Checklist DoR

El motor de scoring se basa en `utils/dorKeywords.js` y `services/dorScoringService.js`.

### Como funciona

1. Cada item del DoR (basado en `docs/DoR.md`) tiene un set de **keywords** asociadas
2. Cuando se agrega feedback, el texto del comentario y subcategoria se analizan contra esas keywords
3. Si una keyword negativa se encuentra → el item del checklist se marca como **fail**
4. Si hay feedback en la categoria pero sin keywords negativas → **pass**
5. Si no hay feedback en esa categoria → **unreviewed**

### Categorias DoR

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
  // Agregar una nueva regla:
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

**Hoja Sessions**: sessionId, title, project, status, createdAt, closedAt, dorScore, createdBy, presenters (JSON)

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

## Issues recurrentes

El sistema detecta problemas que se repiten en multiples sesiones para un disenador. Se muestran en el dashboard con la frecuencia y las sesiones afectadas.

## Insights automaticos

Compara la sesion actual vs la anterior para generar mensajes como:
- "Mejoraste tu score DoR de 60% a 80%"
- "Tu score DoR bajo de 80% a 60%"
- "Estados ha sido un problema en 3 sesiones consecutivas"
