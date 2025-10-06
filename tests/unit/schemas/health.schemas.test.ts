import {
  HEALTH_PATHS,
  healthSchemas,
} from '../../../src/infra/web/schemas/health.schemas';
import { HTTP_STATUS, HEALTH_CONFIG } from '../../../src/infra/web/constants/controller.constants';

describe('Health Schema Tests', () => {
  describe('Health Paths', () => {
    it('should have correct health paths', () => {
      expect(HEALTH_PATHS.HEALTH).toBe('/health');
      expect(HEALTH_PATHS.READINESS).toBe('/readiness');
      expect(HEALTH_PATHS.LIVENESS).toBe('/liveness');
    });
  });

  describe('Schema Structure', () => {
    it('should have all required schemas', () => {
      expect(healthSchemas.health).toBeDefined();
      expect(healthSchemas.readiness).toBeDefined();
      expect(healthSchemas.liveness).toBeDefined();
    });

    it('should have correct tags and descriptions', () => {
      expect(healthSchemas.health.tags).toEqual(['Health']);
      expect(healthSchemas.health.summary).toBe('Health check');
      
      expect(healthSchemas.readiness.tags).toEqual(['Health']);
      expect(healthSchemas.readiness.summary).toBe('Readiness check');
      
      expect(healthSchemas.liveness.tags).toEqual(['Health']);
      expect(healthSchemas.liveness.summary).toBe('Liveness check');
    });

    it('should have required response status codes', () => {
      // All schemas should have OK responses
      expect(healthSchemas.health.response[HTTP_STATUS.OK]).toBeDefined();
      expect(healthSchemas.readiness.response[HTTP_STATUS.OK]).toBeDefined();
      expect(healthSchemas.liveness.response[HTTP_STATUS.OK]).toBeDefined();
      
      // All should have error responses
      expect(healthSchemas.health.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(healthSchemas.health.response[HTTP_STATUS.SERVICE_UNAVAILABLE]).toBeDefined();
      expect(healthSchemas.readiness.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(healthSchemas.readiness.response[HTTP_STATUS.SERVICE_UNAVAILABLE]).toBeDefined();
      expect(healthSchemas.liveness.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
    });
  });

  describe('Response Structure Validation', () => {
    it('should have correct health response structure', () => {
      const healthResponse = healthSchemas.health.response[HTTP_STATUS.OK] as any;
      
      expect(healthResponse.type).toBe('object');
      expect(healthResponse.properties.status).toBeDefined();
      expect(healthResponse.properties.status.type).toBe('string');
      expect(healthResponse.properties.status.enum).toEqual([
        HEALTH_CONFIG.STATUS_VALUES.HEALTHY,
        HEALTH_CONFIG.STATUS_VALUES.UNHEALTHY
      ]);
      expect(healthResponse.properties.timestamp).toBeDefined();
      expect(healthResponse.properties.timestamp.type).toBe('string');
      expect(healthResponse.properties.timestamp.format).toBe('date-time');
      expect(healthResponse.properties.uptime).toBeDefined();
      expect(healthResponse.properties.uptime.type).toBe('number');
      expect(healthResponse.properties.services).toBeDefined();
      expect(healthResponse.properties.services.type).toBe('object');
      expect(healthResponse.required).toEqual(['status', 'timestamp', 'uptime', 'services']);
    });

    it('should have correct readiness response structure', () => {
      const readinessResponse = healthSchemas.readiness.response[HTTP_STATUS.OK] as any;
      
      expect(readinessResponse.type).toBe('object');
      expect(readinessResponse.properties.status).toBeDefined();
      expect(readinessResponse.properties.status.type).toBe('string');
      expect(readinessResponse.properties.status.enum).toEqual([
        HEALTH_CONFIG.STATUS_VALUES.READY,
        HEALTH_CONFIG.STATUS_VALUES.NOT_READY
      ]);
      expect(readinessResponse.required).toEqual(['status']);
    });

    it('should have correct liveness response structure', () => {
      const livenessResponse = healthSchemas.liveness.response[HTTP_STATUS.OK] as any;
      
      expect(livenessResponse.type).toBe('object');
      expect(livenessResponse.properties.status).toBeDefined();
      expect(livenessResponse.properties.status.type).toBe('string');
      expect(livenessResponse.properties.status.enum).toEqual([
        HEALTH_CONFIG.STATUS_VALUES.ALIVE,
        HEALTH_CONFIG.STATUS_VALUES.NOT_ALIVE
      ]);
      expect(livenessResponse.required).toEqual(['status']);
    });

    it('should have consistent error response structure', () => {
      const errorResponse = healthSchemas.health.response[HTTP_STATUS.INTERNAL_SERVER_ERROR] as any;
      
      expect(errorResponse.type).toBe('object');
      expect(errorResponse.properties.error).toBeDefined();
      expect(errorResponse.properties.error.type).toBe('object');
      expect(errorResponse.properties.error.properties.message.type).toBe('string');
      expect(errorResponse.properties.error.properties.code.type).toBe('string');
      expect(errorResponse.properties.error.properties.timestamp.type).toBe('string');
      expect(errorResponse.properties.error.properties.timestamp.format).toBe('date-time');
      expect(errorResponse.required).toContain('error');
    });
  });

  describe('Service Schema Validation', () => {
    it('should have correct services property in health response', () => {
      const healthResponse = healthSchemas.health.response[HTTP_STATUS.OK] as any;
      const servicesProperty = healthResponse.properties.services;
      
      expect(servicesProperty.type).toBe('object');
      expect(servicesProperty.additionalProperties).toBeDefined();
      expect(servicesProperty.additionalProperties.type).toBe('string');
      expect(servicesProperty.additionalProperties.enum).toEqual([
        HEALTH_CONFIG.STATUS_VALUES.UP,
        HEALTH_CONFIG.STATUS_VALUES.DOWN
      ]);
    });
  });
});