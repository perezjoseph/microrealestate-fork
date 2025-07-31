/**
 * Base authentication strategy interface
 */
export class AuthStrategy {
  /**
   * Authenticate a request
   * @param {Object} req - Express request object
   * @returns {Object} Authentication result
   */
  // eslint-disable-next-line no-unused-vars
  authenticate(_req) {
    throw new Error('authenticate method must be implemented');
  }

  /**
   * Validate strategy configuration
   * @returns {Object} Validation result
   */
  validateConfig() {
    throw new Error('validateConfig method must be implemented');
  }

  /**
   * Get strategy name
   * @returns {string} Strategy name
   */
  getName() {
    throw new Error('getName method must be implemented');
  }
}

/**
 * Composite authentication strategy that tries multiple strategies
 */
export class CompositeAuthStrategy extends AuthStrategy {
  constructor(strategies = []) {
    super();
    this.strategies = strategies;
  }

  authenticate(req) {
    for (const strategy of this.strategies) {
      const result = strategy.authenticate(req);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: 'Authentication failed with all strategies',
      code: 'AUTH_FAILED'
    };
  }

  validateConfig() {
    const results = this.strategies.map((s) => s.validateConfig());
    const hasValidStrategy = results.some((r) => r.valid);

    return {
      valid: hasValidStrategy,
      strategies: results,
      issues: results.flatMap((r) => r.issues || [])
    };
  }

  getName() {
    return `Composite(${this.strategies.map((s) => s.getName()).join(', ')})`;
  }
}
