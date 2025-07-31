/**
 * Simple logger for standalone WhatsApp service
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'whatsapp-standalone',
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.info(this._formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.debug(this._formatMessage('debug', message, meta));
    }
  }
}

// Export singleton instance
export default new Logger();
