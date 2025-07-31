import jwt from 'jsonwebtoken';

/**
 * Base authentication strategy interface
 */
class AuthStrategy {
  // eslint-disable-next-line no-unused-vars
  authenticate(_req) {
    throw new Error('authenticate method must be implemented');
  }
}

/**
 * JWT authentication strategy
 */
class JWTAuthStrategy extends AuthStrategy {
  constructor(secret) {
    super();
    this.secret = secret;
  }

  authenticate(req) {
    const token = this._extractToken(req);

    if (!token) {
      return {
        success: false,
        error: 'JWT access token required',
        code: 'MISSING_ACCESS_TOKEN'
      };
    }

    if (!this._isValidTokenFormat(token)) {
      return {
        success: false,
        error: 'Invalid access token format',
        code: 'INVALID_TOKEN_FORMAT'
      };
    }

    try {
      const decoded = jwt.verify(token, this.secret);
      const user = this._extractUserFromToken(decoded);

      if (!user) {
        return {
          success: false,
          error: 'Invalid access token structure',
          code: 'INVALID_TOKEN_STRUCTURE'
        };
      }

      return { success: true, user };
    } catch (error) {
      return this._handleJWTError(error);
    }
  }

  _extractToken(req) {
    // Check Authorization header (Bearer token)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }

    // Check sessionToken cookie (for tenant API compatibility)
    return req.cookies?.sessionToken || null;
  }

  _isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  _extractUserFromToken(decoded) {
    if (decoded.account) {
      return {
        type: 'user',
        email: decoded.account.email,
        phone: decoded.account.phone,
        role: decoded.account.role || 'administrator',
        id: decoded.account._id
      };
    }

    if (decoded.application) {
      return {
        type: 'application',
        clientId: decoded.application.clientId,
        role: decoded.application.role || 'administrator'
      };
    }

    if (decoded.service) {
      return {
        type: 'service',
        serviceId: decoded.service.serviceId,
        realmId: decoded.service.realmId,
        role: decoded.service.role || 'administrator'
      };
    }

    return null;
  }

  _handleJWTError(error) {
    const errorMap = {
      TokenExpiredError: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired'
      },
      JsonWebTokenError: {
        code: 'MALFORMED_TOKEN',
        message: 'Malformed access token'
      },
      NotBeforeError: {
        code: 'TOKEN_NOT_ACTIVE',
        message: 'Token not active yet'
      }
    };

    const errorInfo = errorMap[error.name] || {
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Invalid access token'
    };

    return { success: false, error: errorInfo.message, code: errorInfo.code };
  }
}

export { AuthStrategy, JWTAuthStrategy };
