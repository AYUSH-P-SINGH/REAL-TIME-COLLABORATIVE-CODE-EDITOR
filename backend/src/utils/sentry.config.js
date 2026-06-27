// Error Monitoring Setup with Sentry
const Sentry = require('@sentry/node');
const logger = require('./logger');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        request: true,
        serverName: true,
      }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event, hint) {
      // Don't send 404 errors to Sentry
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      // Don't send test errors in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }

      return event;
    },
  });

  // Attach Sentry to Express
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());

  // Capture unhandled errors
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    Sentry.captureException(reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    Sentry.captureException(error);
  });

  logger.info('Sentry error monitoring initialized');
};

const captureException = (error, context = {}) => {
  logger.error(`Error captured: ${error.message}`, { context });

  if (Sentry) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
};

const captureMessage = (message, level = 'info') => {
  logger.log(level, message);

  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  Sentry,
};
