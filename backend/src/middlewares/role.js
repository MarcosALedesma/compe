const HttpError = require('../utils/httpError');
module.exports = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'No tenés permisos'));
