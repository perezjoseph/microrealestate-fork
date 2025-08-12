import * as Emailer from './emailer.js';
import {
  logger,
  Middlewares,
  Service,
  ServiceError,
  StandardRateLimit
} from '@microrealestate/common';
import express from 'express';
import locale from 'locale';

// Template validation configuration
const TEMPLATE_PERMISSIONS = {
  '/emailer/resetpassword': ['reset_password'],
  '/emailer/otp': ['otp'],
  'default': [
    'invoice',
    'rentcall',
    'rentcall_last_reminder',
    'rentcall_reminder'
  ]
};

function validateTemplate(path, templateName) {
  const allowedTemplates = TEMPLATE_PERMISSIONS[path] || TEMPLATE_PERMISSIONS.default;
  
  if (!allowedTemplates.includes(templateName)) {
    logger.warn('Template validation failed', {
      path,
      templateName,
      allowedTemplates
    });
    throw new ServiceError(`Template '${templateName}' not allowed for path '${path}'`, 404);
  }
  
  return true;
}

async function _send(req, res) {
  const { templateName, recordId, params } = req.body;
  
  // Input validation
  if (!templateName) {
    throw new ServiceError('templateName is required', 400);
  }
  
  if (!recordId) {
    throw new ServiceError('recordId is required', 400);
  }
  
  // Validate template permissions
  validateTemplate(req.path, templateName);

  // TODO: pass headers in params
  const results = await Emailer.send(
    req.headers.authorization,
    req.realm?.locale || req.rawLocale.code,
    req.realm?.currency || '',
    req.realm?._id || req.headers.organizationid,
    templateName,
    recordId,
    params
  );

  if (!results || !results.length) {
    throw new ServiceError(
      `no results returned by the email engine after sending the email ${templateName}`,
      500
    );
  }

  res.json(results);
}

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  
  // Rate limiting middleware
  const generalLimiter = StandardRateLimit.emailService();

  const apiRouter = express.Router();
  
  // Apply rate limiting first
  apiRouter.use(generalLimiter);
  
  // parse locale
  apiRouter.use(locale(['fr-FR', 'en', 'pt-BR', 'de-DE', 'es-CO'], 'en')); // used when organization is not set
  apiRouter.post('/emailer/resetpassword', Middlewares.asyncWrapper(_send)); // allow this route even there is no access token
  apiRouter.post('/emailer/otp', Middlewares.asyncWrapper(_send)); // allow this route even there is no access token
  apiRouter.use(
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.checkOrganization(),
    Middlewares.notRoles(['tenant'])
  );

  //     recordId,      // DB record Id
  //     startTerm      // ex. { term: 2018030100 })
  //     endTerm        // ex. { term: 2018040100 })
  apiRouter.get(
    '/emailer/status/:startTerm/:endTerm?',
    Middlewares.asyncWrapper(async (req, res) => {
      const { startTerm, endTerm } = req.params;
      const result = await Emailer.status(
        null,
        Number(startTerm),
        endTerm ? Number(endTerm) : null
      );
      res.json(result);
    })
  );

  // body = {
  //     templateName,  // email template name (invoice, rentcall, rentcall-reminder...)
  //     recordId,      // DB record Id
  //     params         // extra parameters (ex. { term: 2018030100 })
  // }
  apiRouter.post('/emailer', Middlewares.asyncWrapper(_send));

  return apiRouter;
}
