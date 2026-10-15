function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.message || 'Ocurrió un error interno en el servidor.';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error ${statusCode}] ${req.method} ${req.url}:`, message);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode
    }
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `La ruta solicitada [${req.method} ${req.originalUrl}] no fue encontrada en este servidor.`,
      statusCode: 404
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
