export function validateFigmaLink(url) {
  if (!url) return 'El link de Figma es obligatorio';
  const figmaPattern = /^https?:\/\/(www\.)?figma\.com\/(design|file|proto|board)\/.+/i;
  if (!figmaPattern.test(url)) return 'Ingresa un link válido de Figma';
  return null;
}

export function validateSession(data) {
  const errors = {};
  if (!data.title?.trim()) errors.title = 'El título es obligatorio';
  if (!data.presenters?.length) errors.presenters = 'Selecciona al menos un presentador';
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateFeedback(data) {
  const errors = {};
  if (!data.category) errors.category = 'Selecciona una categoría';
  if (!data.severity) errors.severity = 'Selecciona la severidad';
  if (!data.comment?.trim()) errors.comment = 'Agrega un comentario';
  return Object.keys(errors).length > 0 ? errors : null;
}
