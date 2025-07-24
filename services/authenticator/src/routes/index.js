import express from 'express';
import landlordRouter from './landlord.js';
import locale from 'locale';
import tenantRouter from './tenant.js';

export default function () {
  console.log(' Creating main router...');
  const router = express.Router();
  router.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE', 'es-CO'], 'en-US'));
  
  console.log(' Setting up landlord router...');
  try {
    const landlordRouterInstance = landlordRouter();
    console.log(' Landlord router created, type:', typeof landlordRouterInstance);
    router.use('/landlord', landlordRouterInstance);
    console.log(' Landlord router applied');
  } catch (error) {
    console.error(' Error setting up landlord router:', error);
  }
  
  console.log(' Setting up tenant router...');
  try {
    const tenantRouterInstance = tenantRouter();
    console.log(' Tenant router created, type:', typeof tenantRouterInstance);
    router.use('/tenant', tenantRouterInstance);
    console.log(' Tenant router applied');
  } catch (error) {
    console.error(' Error setting up tenant router:', error);
  }
  console.log(' Main router setup complete');
  return router;
}
