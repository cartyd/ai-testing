import {
  HEALTH_ROUTE_CONSTANTS,
  healthResponseSchemas,
  healthErrorSchemas,
  healthSchemas,
} from '../../../src/infra/web/schemas/health.schemas';

describe('Health Schema Tests', () => {
  describe('HEALTH_ROUTE_CONSTANTS', () => {
    describe('Valid constants', () => {
      const validPathTests = [
        {
          name: 'should have correct health path',
          property: 'HEALTH',
          expected: '/health',
        },
        {
          name: 'should have correct readiness path', 
          property: 'READINESS',
          expected: '/readiness',
        },
        {
          name: 'should have correct liveness path',
          property: 'LIVENESS',
          expected: '/liveness',
        },
      ];

      test.each(validPathTests)('$name', ({ property, expected }) => {
        expect(HEALTH_ROUTE_CONSTANTS.PATHS[property as keyof typeof HEALTH_ROUTE_CONSTANTS.PATHS]).toBe(expected);
      });

      const validResponseTypeTests = [
        { type: 'OBJECT', expected: 'object' },
        { type: 'STRING', expected: 'string' },
        { type: 'NUMBER', expected: 'number' },
      ];

      test.each(validResponseTypeTests)('should have correct response type for $type', ({ type, expected }) => {
        expect(HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES[type as keyof typeof HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES]).toBe(expected);
      });

      const validStatusValueTests = [
        { status: 'HEALTHY', expected: 'healthy' },
        { status: 'UNHEALTHY', expected: 'unhealthy' },
        { status: 'UP', expected: 'up' },
        { status: 'DOWN', expected: 'down' },
      ];

      test.each(validStatusValueTests)('should have correct status value for $status', ({ status, expected }) => {
        expect(HEALTH_ROUTE_CONSTANTS.STATUS_VALUES[status as keyof typeof HEALTH_ROUTE_CONSTANTS.STATUS_VALUES]).toBe(expected);
      });

      it('should have correct tag and date format', () => {
        expect(HEALTH_ROUTE_CONSTANTS.TAG).toBe('Health');
        expect(HEALTH_ROUTE_CONSTANTS.DATE_FORMAT).toBe('date-time');
      });
    });
  });

  describe('healthResponseSchemas', () => {
    describe('Valid schema structures', () => {
      it('should have correct fullHealth schema structure', () => {
        const schema = healthResponseSchemas.fullHealth;
        
        expect(schema.type).toBe('object');
        expect(schema.required).toEqual(['status', 'timestamp', 'uptime', 'services']);
      });

      const fullHealthPropertyTests = [
        {
          property: 'status',
          expectedType: 'string',
          hasEnum: true,
          expectedEnum: ['healthy', 'unhealthy'],
        },
        {
          property: 'timestamp',
          expectedType: 'string', 
          hasFormat: true,
          expectedFormat: 'date-time',
        },
        {
          property: 'uptime',
          expectedType: 'number',
          hasEnum: false,
        },
      ];

      test.each(fullHealthPropertyTests)(
        'fullHealth should have property $property with correct type and constraints',
        ({ property, expectedType, hasEnum, expectedEnum, hasFormat, expectedFormat }) => {
          const properties = healthResponseSchemas.fullHealth.properties;
          
          expect(properties).toHaveProperty(property);
          expect(properties[property as keyof typeof properties].type).toBe(expectedType);
          
          if (hasEnum) {
            expect(properties[property as keyof typeof properties]).toHaveProperty('enum', expectedEnum);
          }
          
          if (hasFormat) {
            expect(properties[property as keyof typeof properties]).toHaveProperty('format', expectedFormat);
          }
        }
      );

      it('should have correct services property structure in fullHealth', () => {
        const servicesProperty = healthResponseSchemas.fullHealth.properties.services;
        
        expect(servicesProperty.type).toBe('object');
        expect(servicesProperty.additionalProperties).toBeDefined();
        expect(servicesProperty.additionalProperties.type).toBe('string');
        expect(servicesProperty.additionalProperties.enum).toEqual(['up', 'down']);
      });

      it('should have correct simpleStatus schema structure', () => {
        const schema = healthResponseSchemas.simpleStatus;
        
        expect(schema.type).toBe('object');
        expect(schema.required).toEqual(['status']);
        expect(schema.properties.status.type).toBe('string');
        expect(schema.properties.status.enum).toEqual(['up', 'down']);
      });
    });

    describe('Edge cases', () => {
      it('should ensure all required fields exist in properties for fullHealth', () => {
        const requiredFields = healthResponseSchemas.fullHealth.required;
        const availableProperties = Object.keys(healthResponseSchemas.fullHealth.properties);
        
        requiredFields.forEach(field => {
          expect(availableProperties).toContain(field);
        });
      });

      it('should ensure all required fields exist in properties for simpleStatus', () => {
        const requiredFields = healthResponseSchemas.simpleStatus.required;
        const availableProperties = Object.keys(healthResponseSchemas.simpleStatus.properties);
        
        requiredFields.forEach(field => {
          expect(availableProperties).toContain(field);
        });
      });
    });
  });

  describe('healthErrorSchemas', () => {
    describe('Valid error response structures', () => {
      const validErrorStatusCodes = [
        { code: 500, description: 'Internal Server Error' },
        { code: 503, description: 'Service Unavailable' },
      ];

      test.each(validErrorStatusCodes)(
        'should have correct error schema for $code ($description)',
        ({ code }) => {
          const errorSchema = healthErrorSchemas[code as keyof typeof healthErrorSchemas];
          
          expect(errorSchema.type).toBe('object');
          expect(errorSchema.required).toEqual(['error']);
          expect(errorSchema.properties.error.type).toBe('object');
        }
      );

      const errorPropertyTests = [
        { property: 'message', expectedType: 'string', hasFormat: false },
        { property: 'code', expectedType: 'string', hasFormat: false },
        { property: 'timestamp', expectedType: 'string', hasFormat: true, format: 'date-time' },
      ];

      test.each(errorPropertyTests)(
        'error schemas should have property $property with correct type and format',
        ({ property, expectedType, hasFormat, format }) => {
          const statusCodes = [500, 503] as const;
          
          statusCodes.forEach(statusCode => {
            const errorSchema = healthErrorSchemas[statusCode];
            const errorProperties = errorSchema.properties.error.properties;
            
            expect(errorProperties).toHaveProperty(property);
            expect(errorProperties[property as keyof typeof errorProperties].type).toBe(expectedType);
            
            if (hasFormat) {
              expect(errorProperties[property as keyof typeof errorProperties]).toHaveProperty('format', format);
            }
          });
        }
      );

      it('should have correct required fields in error object', () => {
        const expectedRequired = ['message', 'code', 'timestamp'];
        
        [500, 503].forEach(statusCode => {
          const errorSchema = healthErrorSchemas[statusCode as keyof typeof healthErrorSchemas];
          expect(errorSchema.properties.error.required).toEqual(expectedRequired);
        });
      });
    });
  });

  describe('healthSchemas', () => {
    describe('Valid endpoint schemas', () => {
      const validHealthSchemaTests = [
        {
          name: 'health',
          schema: healthSchemas.health,
          expectedSummary: 'Health check',
          expectedDescription: 'Check the overall health of the service',
          responseKeys: ['200', '500', '503'],
          expectedResponseSchema: healthResponseSchemas.fullHealth,
        },
        {
          name: 'readiness',
          schema: healthSchemas.readiness,
          expectedSummary: 'Readiness check',
          expectedDescription: 'Check if the service is ready to accept requests',
          responseKeys: ['200', '500', '503'],
          expectedResponseSchema: healthResponseSchemas.simpleStatus,
        },
        {
          name: 'liveness',
          schema: healthSchemas.liveness,
          expectedSummary: 'Liveness check',
          expectedDescription: 'Check if the service is alive',
          responseKeys: ['200', '500'],
          expectedResponseSchema: healthResponseSchemas.simpleStatus,
        },
      ];

      test.each(validHealthSchemaTests)(
        'should have correct structure for $name endpoint',
        ({ schema, expectedSummary, expectedDescription, responseKeys, expectedResponseSchema }) => {
          expect(schema.tags).toContain('Health');
          expect(schema.summary).toBe(expectedSummary);
          expect(schema.description).toBe(expectedDescription);
          
          responseKeys.forEach(key => {
            expect(schema.response).toHaveProperty(key);
          });
          
          expect(schema.response[200]).toEqual(expectedResponseSchema);
        }
      );

      it('should have consistent error responses across applicable endpoints', () => {
        const schemasWithServerErrors = [healthSchemas.health, healthSchemas.readiness, healthSchemas.liveness];
        const schemasWithServiceUnavailable = [healthSchemas.health, healthSchemas.readiness];
        
        schemasWithServerErrors.forEach(schema => {
          expect(schema.response).toHaveProperty('500');
          expect(schema.response[500]).toEqual(healthErrorSchemas[500]);
        });
        
        schemasWithServiceUnavailable.forEach(schema => {
          expect(schema.response).toHaveProperty('503');
          expect(schema.response[503]).toEqual(healthErrorSchemas[503]);
        });
      });
    });

    describe('Schema consistency validation', () => {
      const consistencyTests = [
        {
          name: 'should have consistent tag usage across all schemas',
          testFn: () => {
            const schemas = Object.values(healthSchemas);
            schemas.forEach(schema => {
              expect(schema.tags).toContain(HEALTH_ROUTE_CONSTANTS.TAG);
            });
          },
        },
        {
          name: 'should have meaningful summaries for all schemas',
          testFn: () => {
            const schemas = Object.values(healthSchemas);
            schemas.forEach(schema => {
              expect(schema.summary).toBeDefined();
              expect(schema.summary.length).toBeGreaterThan(0);
            });
          },
        },
        {
          name: 'should have descriptions for all schemas',
          testFn: () => {
            const schemas = Object.values(healthSchemas);
            schemas.forEach(schema => {
              expect(schema.description).toBeDefined();
              expect(schema.description.length).toBeGreaterThan(0);
            });
          },
        },
      ];

      test.each(consistencyTests)('$name', ({ testFn }) => {
        testFn();
      });
    });
  });

  describe('Type consistency validation', () => {
    const typeConsistencyTests = [
      {
        name: 'should use HEALTH_ROUTE_CONSTANTS for response type definitions',
        testFn: () => {
          expect(healthResponseSchemas.fullHealth.type).toBe(HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT);
          expect(healthResponseSchemas.simpleStatus.type).toBe(HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT);
        },
      },
      {
        name: 'should use consistent status values from constants',
        testFn: () => {
          const fullHealthStatusEnum = healthResponseSchemas.fullHealth.properties.status.enum;
          expect(fullHealthStatusEnum).toContain(HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.HEALTHY);
          expect(fullHealthStatusEnum).toContain(HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UNHEALTHY);
          
          const simpleStatusEnum = healthResponseSchemas.simpleStatus.properties.status.enum;
          expect(simpleStatusEnum).toContain(HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UP);
          expect(simpleStatusEnum).toContain(HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.DOWN);
        },
      },
      {
        name: 'should use consistent date format across schemas',
        testFn: () => {
          const timestampFields = [
            healthResponseSchemas.fullHealth.properties.timestamp,
            healthErrorSchemas[500].properties.error.properties.timestamp,
            healthErrorSchemas[503].properties.error.properties.timestamp,
          ];
          
          timestampFields.forEach(field => {
            expect(field.format).toBe(HEALTH_ROUTE_CONSTANTS.DATE_FORMAT);
          });
        },
      },
    ];

    test.each(typeConsistencyTests)('$name', ({ testFn }) => {
      testFn();
    });
  });

  describe('Invalid cases', () => {
    describe('Schema structure validation', () => {
      it('should ensure response schemas have all expected properties', () => {
        const fullHealthProperties = Object.keys(healthResponseSchemas.fullHealth.properties);
        const expectedFullHealthProps = ['status', 'timestamp', 'uptime', 'services'];
        
        expectedFullHealthProps.forEach(prop => {
          expect(fullHealthProperties).toContain(prop);
        });
        
        const simpleStatusProperties = Object.keys(healthResponseSchemas.simpleStatus.properties);
        expect(simpleStatusProperties).toContain('status');
      });

      it('should ensure error schemas have proper error structure', () => {
        [500, 503].forEach(statusCode => {
          const errorSchema = healthErrorSchemas[statusCode as keyof typeof healthErrorSchemas];
          
          expect(errorSchema.properties).toHaveProperty('error');
          expect(errorSchema.properties.error.type).toBe('object');
          expect(errorSchema.properties.error.properties).toHaveProperty('message');
          expect(errorSchema.properties.error.properties).toHaveProperty('code');
          expect(errorSchema.properties.error.properties).toHaveProperty('timestamp');
        });
      });

      it('should ensure enum values are consistent with constants', () => {
        const fullHealthStatusEnum = healthResponseSchemas.fullHealth.properties.status.enum;
        const expectedHealthStatuses = [
          HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.HEALTHY,
          HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UNHEALTHY,
        ];
        expect(fullHealthStatusEnum).toEqual(expectedHealthStatuses);
        
        const servicesEnum = healthResponseSchemas.fullHealth.properties.services.additionalProperties.enum;
        const expectedServiceStatuses = [
          HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UP,
          HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.DOWN,
        ];
        expect(servicesEnum).toEqual(expectedServiceStatuses);
      });
    });
  });
});