import { Middlewares, Service } from '@microrealestate/common';
import documents from './documents.js';
import express from 'express';
import rateLimit from 'express-rate-limit';
import templates from './templates.js';

export default function () {
  // Rate limiting middleware
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs (lower for PDF generation)
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
