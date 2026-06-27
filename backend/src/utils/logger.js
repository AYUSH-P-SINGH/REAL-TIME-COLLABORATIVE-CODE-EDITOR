const winston = require('winston');

// Note: importing directly from env can cause circular deps if env imports logger.
// But env.js doesn't import logger, it just logs using console.error. So it's safe.
const env = require('../config/env');

const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
