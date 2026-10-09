const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const HttpError = require('../utils/httpError');

module.exports = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Token requerido'));
  try {
    req.user = jwt.verify(token, jwtSecret); // { id, role, email }
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
};
