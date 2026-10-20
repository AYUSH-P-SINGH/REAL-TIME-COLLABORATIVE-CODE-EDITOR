const logger = require('./logger');

/**
 * Three-State Circuit Breaker Pattern (CLOSED -> OPEN -> HALF_OPEN)
 * Prevents cascading outages when downstream dependencies (MongoDB, Redis, Sandbox)
 * experience network partitions, saturation, or high latency.
 */
class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {string} options.name Name of the monitored dependency (e.g., 'MongoDB', 'Redis')
   * @param {number} [options.failureThreshold=5] Consecutive failures to trip breaker
   * @param {number} [options.resetTimeoutMs=10000] Time to wait in OPEN state before trying HALF_OPEN
   */
  constructor({ name = 'Service', failureThreshold = 5, resetTimeoutMs = 10000 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Executes a protected asynchronous operation.
   * If the circuit is OPEN, fails immediately or invokes the fallback.
   * @param {Function} action Asynchronous function to execute
   * @param {Function} [fallback] Optional fallback function if circuit is OPEN or action fails
   */
  async execute(action, fallback = null) {
    const now = Date.now();

    // Check if OPEN circuit should transition to HALF_OPEN
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        logger.info(`⚡ Circuit Breaker [${this.name}]: Transitioning from OPEN to HALF_OPEN (trial request)`);
        this.state = 'HALF_OPEN';
      } else {
        if (fallback) return fallback();
        const err = new Error(`Circuit Breaker [${this.name}] is OPEN. Request rejected to prevent cascading failure.`);
        err.statusCode = 503;
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) return fallback(err);
      throw err;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      logger.info(`✅ Circuit Breaker [${this.name}]: Downstream recovered. Transitioning from HALF_OPEN to CLOSED`);
      this.state = 'CLOSED';
    }
    this.failureCount = 0;
  }

  onFailure(err) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    logger.warn(`⚠️ Circuit Breaker [${this.name}] failure (${this.failureCount}/${this.failureThreshold}): ${err.message}`);

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      logger.error(`🚨 Circuit Breaker [${this.name}] TRIPPED to OPEN state. All incoming calls will fail fast.`);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

// Pre-configured circuit breakers for critical infrastructure
const mongoCircuitBreaker = new CircuitBreaker({ name: 'MongoDB', failureThreshold: 5, resetTimeoutMs: 10000 });
const redisCircuitBreaker = new CircuitBreaker({ name: 'Redis', failureThreshold: 4, resetTimeoutMs: 8000 });

module.exports = {
  CircuitBreaker,
  mongoCircuitBreaker,
  redisCircuitBreaker
};
