import { logger, Service } from '@microrealestate/common';

/**
 * Performs comprehensive health checks for the API service
 * @returns {Promise<Object>} Health status object
 */
export async function performHealthCheck() {
  const service = Service.getInstance();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api',
    checks: {}
  };

  try {
    // Check MongoDB connection
    if (service.mongoClient) {
      try {
        await service.mongoClient.db.admin().ping();
        health.checks.mongodb = { status: 'healthy' };
      } catch (error) {
        health.checks.mongodb = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'unhealthy';
      }
    }

    // Check Redis connection
    if (service.redisClient) {
      try {
        await service.redisClient.ping();
        health.checks.redis = { status: 'healthy' };
      } catch (error) {
        health.checks.redis = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'unhealthy';
      }
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    health.status = 'unhealthy';
    health.error = error.message;
  }

  return health;
}
