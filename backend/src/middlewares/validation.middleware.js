// Validation Middleware
const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });

      // Replace req.body with validated data
      req.body = validated;
      next();
    } catch (error) {
      logger.error(`Validation error: ${error.message}`);

      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
  };
};

module.exports = { validate };
