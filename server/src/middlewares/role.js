import { HttpError } from '../utils/httpError.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'No autenticado'));
  if (!roles.includes(req.user.rol)) {
    return next(new HttpError(403, 'No autorizado para esta acción'));
  }
  next();
};