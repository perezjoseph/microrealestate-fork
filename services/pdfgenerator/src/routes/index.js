import { Middlewares, Service } from '@microrealestate/common';
import documents from './documents.js';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import templates from './templates.js';

export default function () {
  // Rate limiting middleware
  const isDemoMode = process.env.DEMO_MODE === 'true';
  console.log('PDF Generator Service - Demo mode detected:', isDemoMode);
  
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDemoMode ? 500 : 50, // Much higher limit in demo mode
    message: 'Too many PDF generation requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiRoutes = express.Router('/pdfgenerator');
  
  // Apply rate limiting first
  apiRoutes.use(generalLimiter);
  
  apiRoutes.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization()
  );
  apiRoutes.use('/templates', templates());
  apiRoutes.use('/documents', documents());

  const routes = express.Router();
  routes.use('/pdfgenerator', apiRoutes);
  return routes;
}
