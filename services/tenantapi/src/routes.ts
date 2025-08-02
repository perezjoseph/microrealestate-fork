import * as Express from 'express';
import { Controllers } from './controllers/index.js';
import { Middlewares } from '@microrealestate/common';
import rateLimit from 'express-rate-limit';

const routes = Express.Router();

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
routes.use(generalLimiter);

routes.get('/tenants', Middlewares.asyncWrapper(Controllers.getAllTenants));
routes.get(
  '/tenant/:tenantId',
  Middlewares.asyncWrapper(Controllers.getOneTenant)
);

export default routes;
