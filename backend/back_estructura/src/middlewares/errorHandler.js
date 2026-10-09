import { HttpError } from '../utils/httpError.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  const msg = err.message || '';
  if (msg.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'Registro duplicado', details: msg });
  }
  if (msg.includes('CHECK constraint failed')) {
    return res.status(400).json({ error: 'Dato inválido (CHECK)', details: msg });
  }
  if (msg.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ error: 'Referencia inválida (FK)', details: msg });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};