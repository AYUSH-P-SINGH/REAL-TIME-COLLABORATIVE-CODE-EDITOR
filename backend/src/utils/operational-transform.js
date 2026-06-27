// Operational Transformation (OT) Algorithm for Conflict Resolution
const logger = require('./logger');

class OperationalTransformation {
  /**
   * Represents an operation that modifies text
   * @typedef {Object} Operation
   * @property {number} p - Position to insert/delete
   * @property {string} [s] - String to insert
   * @property {number} [d] - Number of characters to delete
   */

  /**
   * Transform operation A against operation B
   * Used when both clients edit simultaneously
   */
  static transform(opA, opB) {
    try {
      if (opA.p < opB.p) {
        // opA is before opB
        return opA;
      } else if (opA.p > opB.p) {
        // opA is after opB
        const offset = opB.s ? opB.s.length : -(opB.d || 0);
        return {
          ...opA,
          p: opA.p + offset,
        };
      } else {
        // opA and opB are at same position
        // Insert before delete
        if (opA.s && opB.d) {
          return opA;
        }
        // Otherwise, keep opA unchanged
        return opA;
      }
    } catch (error) {
      logger.error(`OT transform failed: ${error.message}`);
      return opA;
    }
  }

  /**
   * Compose two sequential operations
   */
  static compose(op1, op2) {
    try {
      if (!op1.s && !op1.d) return op2;
      if (!op2.s && !op2.d) return op1;

      // If op1 is insert and op2 is in the inserted text
      if (op1.s && op2.p >= op1.p && op2.p <= op1.p + op1.s.length) {
        if (op2.s) {
          // Both inserts - combine
          const combined = op1.s.slice(0, op2.p - op1.p) + 
                          op2.s + 
                          op1.s.slice(op2.p - op1.p);
          return {
            p: op1.p,
            s: combined,
          };
        }
      }

      // Default: apply ops sequentially
      return {
        p: op1.p,
        s: op1.s,
        d: op1.d,
      };
    } catch (error) {
      logger.error(`OT compose failed: ${error.message}`);
      return op1;
    }
  }

  /**
   * Apply operation to text
   */
  static applyOp(text, op) {
    try {
      if (!op.p) return text;

      if (op.s) {
        // Insert
        return text.slice(0, op.p) + op.s + text.slice(op.p);
      } else if (op.d) {
        // Delete
        return text.slice(0, op.p) + text.slice(op.p + op.d);
      }

      return text;
    } catch (error) {
      logger.error(`OT apply failed: ${error.message}`);
      return text;
    }
  }

  /**
   * Resolve conflicting edits using OT
   */
  static resolveConflict(baseText, editA, editB) {
    try {
      // Transform editB against editA
      const transformedB = this.transform(editB, editA);

      // Apply both operations
      let result = this.applyOp(baseText, editA);
      result = this.applyOp(result, transformedB);

      return result;
    } catch (error) {
      logger.error(`OT conflict resolution failed: ${error.message}`);
      return baseText;
    }
  }

  /**
   * Create inverse operation (for undo)
   */
  static invert(op, text) {
    try {
      if (op.s) {
        // Insert -> Delete
        return {
          p: op.p,
          d: op.s.length,
        };
      } else if (op.d) {
        // Delete -> Insert
        const deletedText = text.slice(op.p, op.p + op.d);
        return {
          p: op.p,
          s: deletedText,
        };
      }
      return op;
    } catch (error) {
      logger.error(`OT invert failed: ${error.message}`);
      return op;
    }
  }
}

module.exports = OperationalTransformation;
