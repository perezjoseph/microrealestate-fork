import {
  Collections,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import locale from 'locale';

console.log(' LANDLORD MODULE: Loading successfully...');

// Create rate limiting middleware directly in this file
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
    details: 'For security reasons, we limit login attempts to prevent unauthorized access.',
    retryAfter: 15 * 60,
    type: 'RATE_LIMIT_AUTH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🚨 AUTH RATE LIMIT TRIGGERED for IP:', req.ip, 'on path:', req.path);
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      details: 'For security reasons, we limit login attempts to prevent unauthorized access.',
      retryAfter: 15 * 60,
      retryAfterMinutes: 15,
      type: 'RATE_LIMIT_AUTH',
      timestamp: new Date().toISOString()
    });
  }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests. Please wait 1 hour before trying again.',
    details: 'Password reset requests are limited to prevent abuse.',
    retryAfter: 60 * 60,
    type: 'RATE_LIMIT_PASSWORD_RESET'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🚨 PASSWORD RESET RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many password reset requests. Please wait 1 hour before trying again.',
      details: 'Password reset requests are limited to prevent abuse. If you need immediate assistance, please contact support.',
      retryAfter: 60 * 60,
      retryAfterMinutes: 60,
      type: 'RATE_LIMIT_PASSWORD_RESET',
      timestamp: new Date().toISOString()
    });
  }
});

const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 signup attempts per hour
  message: {
    error: 'Too many account creation attempts. Please wait 1 hour before trying again.',
    details: 'Account creation is limited to prevent spam and abuse.',
    retryAfter: 60 * 60,
    type: 'RATE_LIMIT_SIGNUP'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🚨 SIGNUP RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Signup rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many account creation attempts. Please wait 1 hour before trying again.',
      details: 'Account creation is limited to prevent spam and abuse. If you need immediate assistance, please contact support.',
      retryAfter: 60 * 60,
      retryAfterMinutes: 60,
      type: 'RATE_LIMIT_SIGNUP',
      timestamp: new Date().toISOString()
    });
  }
});

const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: (hits) => hits * 1000, // Add 1 second delay per hit after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  onLimitReached: (req, res, options) => {
    console.log('⏰ AUTH SLOW DOWN TRIGGERED for IP:', req.ip, 'on path:', req.path);
    logger.warn(`Slow down limit reached for IP: ${req.ip} on ${req.path}`);
    
    // Add a custom header to inform about the delay
    res.set('X-RateLimit-Delay', 'Authentication requests are being slowed down due to repeated attempts');
  }
});

const tokenRefreshRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow more frequent token refreshes
  message: {
    error: 'Too many token refresh attempts. Please wait 5 minutes before trying again.',
    details: 'Token refresh requests are limited for security purposes.',
    retryAfter: 5 * 60,
    type: 'RATE_LIMIT_TOKEN_REFRESH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🚨 TOKEN REFRESH RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Token refresh rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many token refresh attempts. Please wait 5 minutes before trying again.',
      details: 'Token refresh requests are limited for security purposes. Please try again in a few minutes.',
      retryAfter: 5 * 60,
      retryAfterMinutes: 5,
      type: 'RATE_LIMIT_TOKEN_REFRESH',
      timestamp: new Date().toISOString()
    });
  }
});

const createAccountSpecificRateLimit = (windowMs = 15 * 60 * 1000, max = 10) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      const key = req.body?.email || req.ip;
      return key;
    },
    message: {
      error: 'Too many attempts for this account. Please wait before trying again.',
      details: 'Multiple failed attempts have been detected for this account.',
      retryAfter: windowMs / 1000,
      type: 'RATE_LIMIT_ACCOUNT_SPECIFIC'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const identifier = req.body?.email || req.ip;
      const isEmail = req.body?.email ? true : false;
      const waitMinutes = Math.ceil(windowMs / (1000 * 60));
      
      console.log('🚨 ACCOUNT-SPECIFIC RATE LIMIT TRIGGERED for:', identifier, 'on path:', req.path);
      logger.warn(`Account-specific rate limit exceeded for: ${identifier} on ${req.path}`);
      
      res.status(429).json({
        error: isEmail 
          ? `Too many attempts for account ${req.body.email}. Please wait ${waitMinutes} minutes before trying again.`
          : `Too many attempts from your location. Please wait ${waitMinutes} minutes before trying again.`,
        details: isEmail 
          ? 'Multiple failed login attempts have been detected for this email address. This is a security measure to protect your account.'
          : 'Multiple failed attempts have been detected from your location. This is a security measure to prevent unauthorized access.',
        retryAfter: windowMs / 1000,
        retryAfterMinutes: waitMinutes,
        type: 'RATE_LIMIT_ACCOUNT_SPECIFIC',
        identifier: isEmail ? 'email' : 'ip',
        timestamp: new Date().toISOString()
      });
    }
  });
};

console.log(' LANDLORD MODULE: Rate limiting middleware created successfully');

// Rate limit warning middleware - provides feedback before hitting the limit
const rateLimitWarning = (req, res, next) => {
  // Add warning headers when approaching rate limits
  const addWarningHeaders = (remaining, limit, windowMs) => {
    if (remaining <= 2 && remaining > 0) {
      const waitMinutes = Math.ceil(windowMs / (1000 * 60));
      res.set('X-RateLimit-Warning', `Only ${remaining} attempts remaining. Limit resets in ${waitMinutes} minutes.`);
      console.log(`⚠️  RATE LIMIT WARNING: ${remaining} attempts remaining for IP ${req.ip} on ${req.path}`);
    }
  };

  // Override res.json to add warnings to successful responses
  const originalJson = res.json;
  res.json = function(data) {
    // Check if this is a successful authentication response
    if (res.statusCode === 200 && req.path === '/signin') {
      const rateLimitRemaining = res.get('X-RateLimit-Remaining');
      const rateLimitLimit = res.get('X-RateLimit-Limit');
      
      if (rateLimitRemaining && rateLimitLimit) {
        const remaining = parseInt(rateLimitRemaining);
        const limit = parseInt(rateLimitLimit);
        
        if (remaining <= 2 && remaining > 0) {
          data.warning = {
            message: `Security Notice: You have ${remaining} login attempts remaining before temporary lockout.`,
            details: 'For your account security, login attempts are limited. Please ensure you are using the correct credentials.',
            attemptsRemaining: remaining,
            totalAttempts: limit
          };
        }
      }
    }
    
    return originalJson.call(this, data);
  };

  next();
};

const _generateTokens = async (dbAccount) => {
  const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, PRODUCTION } =
    Service.getInstance().envConfig.getValues();
  const { _id, password, ...account } = dbAccount;
  const refreshToken = jwt.sign({ account }, REFRESH_TOKEN_SECRET, {
    expiresIn: PRODUCTION ? '600s' : '12h'
  });
  const accessToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
    expiresIn: '30s'
  });

  // save tokens
  await Service.getInstance().redisClient.set(refreshToken, accessToken);

  return {
    refreshToken,
    accessToken
  };
};

const _refreshTokens = async (oldRefreshToken) => {
  const { REFRESH_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const oldAccessToken =
    await Service.getInstance().redisClient.get(oldRefreshToken);
  if (!oldAccessToken) {
    logger.error('refresh token not found in database');
    return {};
  }

  let account;
  try {
    const payload = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    if (payload && payload.account) {
      account = payload.account;
    }
  } catch (exc) {
    logger.error(exc);
  }
  await _clearTokens(oldRefreshToken);

  if (!account) {
    return {};
  }

  return await _generateTokens(account);
};

const _clearTokens = async (refreshToken) => {
  await Service.getInstance().redisClient.del(refreshToken);
};

const _applicationSignIn = Middlewares.asyncWrapper(async (req, res) => {
  const { APPCREDZ_TOKEN_SECRET, ACCESS_TOKEN_SECRET } =
    Service.getInstance().envConfig.getValues();
  const { clientId, clientSecret } = req.body;
  if (
    [clientId, clientSecret].map((el) => el.trim()).some((el) => !!el === false)
  ) {
    logger.error('M2M login failed some fields are missing');
    throw new ServiceError('missing fields', 422);
  }

  // clientSecret is a JWT which contains the organizationId & clientId
  let organizationId;
  let keyId;
  let payload;
  try {
    payload = jwt.verify(clientSecret, APPCREDZ_TOKEN_SECRET);
  } catch (exc) {
    if (exc instanceof jwt.TokenExpiredError) {
      logger.info(
        `login failed for application ${clientId}@${organizationId}: expired token`
      );
      throw new ServiceError('expired clientId', 401);
    } else {
      throw new ServiceError('invalid credentials', 401);
    }
  }

  if (payload?.organizationId && payload?.jti) {
    organizationId = payload.organizationId;
    keyId = payload.jti;
  } else {
    logger.error(
      'Provided clientSecret is valid but does not have required fields'
    );
    throw new ServiceError('invalid credentials', 401);
  }

  // ensure keyId & clientId matches
  if (clientId !== keyId) {
    logger.info(
      `login failed for application ${clientId}@${organizationId}: clientId & clientSecret not matching`
    );
    throw new ServiceError('invalid credentials', 401);
  }

  // find the client details within the realm
  const realm = (
    await Collections.Realm.findOne({ _id: organizationId })
  )?.toObject();
  if (!realm) {
    logger.info(
      `login failed for application ${clientId}@${organizationId}: realm not found`
    );
    throw new ServiceError('invalid credentials', 401);
  }
  const application = realm.applications?.find(
    (app) => app?.clientId === clientId
  );
  if (!application) {
    logger.info(
      `login failed for application ${clientId}@${organizationId}: appplication revoked`
    );
    throw new ServiceError('revoked clientId', 401);
  }

  // check clientSecret
  const validSecret = await bcrypt.compare(
    clientSecret,
    application.clientSecret
  );
  if (!validSecret) {
    logger.info(
      `login failed for application ${clientId}@${organizationId}: bad secret`
    );
    throw new ServiceError('invalid credentials', 401);
  }

  // Generate only an accessToken, but no refreshToken
  delete application.clientSecret;
  const accessToken = jwt.sign({ application }, ACCESS_TOKEN_SECRET, {
    expiresIn: '300s'
  });

  res.json({
    accessToken,
    organizationId
  });
});

const _userSignIn = Middlewares.asyncWrapper(async (req, res) => {
  const { TOKEN_COOKIE_ATTRIBUTES } =
    Service.getInstance().envConfig.getValues();
  const { email, password } = req.body;
  if ([email, password].map((el) => el.trim()).some((el) => !!el === false)) {
    logger.error('login failed some fields are missing');
    throw new ServiceError('missing fields', 422);
  }

  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  }).lean();

  if (!account) {
    logger.info(`login failed for ${email} account not found`);
    throw new ServiceError('invalid credentials', 401);
  }

  const validPassword = await bcrypt.compare(password, account.password);
  if (!validPassword) {
    logger.info(`login failed for ${email} bad password`);
    throw new ServiceError('invalid credentials', 401);
  }

  const { refreshToken, accessToken } = await _generateTokens(account);

  logger.debug(
    `create a new refresh token ${refreshToken} for domain ${req.hostname}`
  );
  res.cookie('refreshToken', refreshToken, TOKEN_COOKIE_ATTRIBUTES);
  res.json({
    accessToken
  });
});

export default function () {
  console.log(' LANDLORD ROUTER: Starting setup...');
  
  const {
    APPCREDZ_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET,
    EMAILER_URL,
    RESET_TOKEN_SECRET,
    SIGNUP,
    TOKEN_COOKIE_ATTRIBUTES
  } = Service.getInstance().envConfig.getValues();
  const landlordRouter = express.Router();

  console.log(' LANDLORD ROUTER: Environment config loaded, SIGNUP enabled:', SIGNUP);

  // parse locale
  landlordRouter.use(
    locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE', 'es-CO'], 'en-US')
  );

  // Add basic test middleware
  landlordRouter.use((req, res, next) => {
    console.log(' BASIC MIDDLEWARE: Request received -', req.method, req.path);
    next();
  });

  // Add security monitoring middleware (basic logging)
  landlordRouter.use((req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;
    
    // Log suspicious patterns
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      console.log('🤖 SECURITY: Bot detected -', ip, userAgent);
    }
    
    // Track failed attempts (basic implementation)
    if (req.method === 'POST' && req.path === '/signin') {
      console.log('🔐 SECURITY: Authentication attempt from', ip);
    }
    
    next();
  });

  if (SIGNUP) {
    console.log(' LANDLORD ROUTER: Setting up signup route with rate limiting...');
    landlordRouter.post(
      '/signup',
      (req, res, next) => {
        console.log(' SIGNUP ROUTE: Request received');
        next();
      },
      signupRateLimit,
      createAccountSpecificRateLimit(60 * 60 * 1000, 3), // 3 attempts per hour per email
      Middlewares.asyncWrapper(async (req, res) => {
        console.log(' SIGNUP HANDLER: Processing request for:', req.body?.email);
        const { firstname, lastname, email, password } = req.body;
        if (
          [firstname, lastname, email, password]
            .map((el) => el.trim())
            .some((el) => !!el === false)
        ) {
          throw new ServiceError('missing fields', 422);
        }
        const existingAccount = await Collections.Account.findOne({
          email: email.toLowerCase()
        });
        if (existingAccount) {
          // status code 201 to avoid account enumeration (consistent response)
          return res.sendStatus(201);
        }
        await Collections.Account.create({
          firstname,
          lastname,
          email,
          password
        });
        res.sendStatus(201);
      })
    );
    console.log(' LANDLORD ROUTER: Signup route configured with rate limiting');
  }

  console.log('🔐 LANDLORD ROUTER: Setting up signin route with comprehensive rate limiting...');
  landlordRouter.post(
    '/signin',
    (req, res, next) => {
      console.log(' SIGNIN ROUTE: Request received');
      next();
    },
    rateLimitWarning, // Add warning feedback before rate limiting
    authRateLimit, // Rate limit authentication attempts
    authSlowDown, // Progressive delay for repeated attempts
    createAccountSpecificRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes per email
    Middlewares.asyncWrapper(async (req, res) => {
      console.log('🔐 SIGNIN HANDLER: Processing request for:', req.body?.email);
      if (!req.body.email && !req.body.clientId) {
        throw new ServiceError('missing fields', 422);
      }

      if (req.body.email) {
        return await _userSignIn(req, res);
      }

      if (req.body.clientId) {
        return await _applicationSignIn(req, res);
      }
    })
  );
  console.log(' LANDLORD ROUTER: Signin route configured with comprehensive rate limiting');

  landlordRouter.use(
    '/appcredz',
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET)
  );
  landlordRouter.use('/appcredz', Middlewares.checkOrganization());
  landlordRouter.post(
    '/appcredz',
    Middlewares.asyncWrapper(async (req, res) => {
      // ensure the user is administrator
      if (req.user.role !== 'administrator') {
        throw new ServiceError(
          'your current role does not allow to perform this action',
          403
        );
      }

      const { expiry, organizationId } = req.body;
      if (
        [expiry, organizationId]
          .map((el) => el.trim())
          .some((el) => !!el === false)
      ) {
        logger.error('AppCredz creation failed some fields are missing');
        throw new ServiceError('missing fields', 422);
      }
      const expiryDate = new Date(expiry);

      // Create clientId & clientSecret
      const clientId = crypto.randomUUID();
      const clientSecret = jwt.sign(
        {
          organizationId,
          jti: clientId,
          exp: expiryDate.getTime() / 1000
        },
        APPCREDZ_TOKEN_SECRET
      );

      res.json({
        clientId,
        clientSecret
      });
    })
  );

  landlordRouter.post(
    '/refreshtoken',
    tokenRefreshRateLimit, // Rate limit token refresh attempts
    Middlewares.asyncWrapper(async (req, res) => {
      const oldRefreshToken = req.cookies.refreshToken;
      logger.debug(`give a new refresh token for ${oldRefreshToken}`);
      if (!oldRefreshToken) {
        logger.debug('missing refresh token');
        throw new ServiceError('invalid credentials', 403);
      }

      const { refreshToken, accessToken } =
        await _refreshTokens(oldRefreshToken);
      if (!refreshToken) {
        res.clearCookie('refreshToken', TOKEN_COOKIE_ATTRIBUTES);
        throw new ServiceError('invalid credentials', 403);
      }

      res.cookie('refreshToken', refreshToken, TOKEN_COOKIE_ATTRIBUTES);
      res.json({
        accessToken
      });
    })
  );

  landlordRouter.delete(
    '/signout',
    Middlewares.asyncWrapper(async (req, res) => {
      const refreshToken = req.cookies.refreshToken;
      logger.debug(`remove the refresh token: ${refreshToken}`);
      if (!refreshToken) {
        return res.sendStatus(202);
      }

      res.clearCookie('refreshToken', TOKEN_COOKIE_ATTRIBUTES);
      await _clearTokens(refreshToken);
      res.sendStatus(204);
    })
  );

  console.log('🔑 LANDLORD ROUTER: Setting up password reset routes with rate limiting...');
  landlordRouter.post(
    '/forgotpassword',
    (req, res, next) => {
      console.log(' FORGOT PASSWORD ROUTE: Request received');
      next();
    },
    passwordResetRateLimit, // Rate limit password reset requests
    createAccountSpecificRateLimit(60 * 60 * 1000, 2), // 2 attempts per hour per email
    Middlewares.asyncWrapper(async (req, res) => {
      console.log('🔑 FORGOT PASSWORD HANDLER: Processing request for:', req.body?.email);
      const { email } = req.body;
      if (!email) {
        logger.error('missing email field');
        throw new ServiceError('missing fields', 422);
      }
      // check if user exists
      const account = await Collections.Account.findOne({
        email: email.toLowerCase()
      });
      if (account) {
        // generate reset token valid for one hour
        const token = jwt.sign({ email }, RESET_TOKEN_SECRET, {
          expiresIn: '1h'
        });
        await Service.getInstance().redisClient.set(token, email);

        // send email
        await axios.post(
          `${EMAILER_URL}/resetpassword`,
          {
            templateName: 'reset_password',
            recordId: email,
            params: {
              token
            }
          },
          {
            headers: {
              'Accept-Language': req.rawLocale.code
            }
          }
        );
      }
      // Always return 204 to prevent email enumeration
      res.sendStatus(204);
    })
  );

  landlordRouter.patch(
    '/resetpassword',
    (req, res, next) => {
      console.log(' RESET PASSWORD ROUTE: Request received');
      next();
    },
    authRateLimit, // Rate limit password reset attempts
    Middlewares.asyncWrapper(async (req, res) => {
      console.log('🔑 RESET PASSWORD HANDLER: Processing request');
      const { resetToken, password } = req.body;
      if (
        [resetToken, password]
          .map((el) => el.trim())
          .some((el) => !!el === false)
      ) {
        throw new ServiceError('missing fields', 422);
      }

      const email = await Service.getInstance().redisClient.get(resetToken);
      if (!email) {
        throw new ServiceError('invalid credentials', 403);
      }

      await Service.getInstance().redisClient.del(resetToken);

      try {
        jwt.verify(resetToken, RESET_TOKEN_SECRET);
      } catch (error) {
        throw new ServiceError(error, 403);
      }

      const account = await Collections.Account.findOne({
        email: email.toLowerCase()
      });
      account.password = password;
      await account.save();

      res.sendStatus(200);
    })
  );

  console.log(' LANDLORD ROUTER: All routes configured with comprehensive rate limiting');
  console.log(' LANDLORD ROUTER: Setup complete, returning router');
  return landlordRouter;
}
