const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn(`${err.name}: ${err.message} [${req.method} ${req.path}]`);
    return res.status(err.statusCode).json({ error: err.expose ? err.message : 'Internal server error' });
  }

  if (err.name === 'SyntaxError' && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  logger.error(`Unhandled error [${req.method} ${req.path}]:`, err.stack || err.message || err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
