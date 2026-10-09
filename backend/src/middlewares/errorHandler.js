exports.notFound = (req, res) =>
  res.status(404).json({ error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });

// Formato de error único: { error: { message, details? } }
exports.errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: { message: status === 500 ? 'Error interno del servidor' : err.message, details: err.details },
  });
};
