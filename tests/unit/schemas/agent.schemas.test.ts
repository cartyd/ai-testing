import { 
  ROUTE_CONSTANTS,
  commonParams,
  agentDataSchema,
  responseWrappers,
  agentErrorSchemas,
  agentSchemas,
} from '../../../src/infra/web/schemas/agent.schemas';
import { HTTP_STATUS } from '../../../src/infra/web/constants/controller.constants';

describe('Agent Schema Tests', () => {
  describe('ROUTE_CONSTANTS', () => {
    describe('Valid constants', () => {
      const validConstantTests = [
        {
          name: 'should have correct API prefix',
          property: 'PREFIX',
          expected: '/api/v1/agents',
        },
        {
          name: 'should have correct tag name', 
          property: 'TAG',
          expected: 'Agents',
        },
        {
          name: 'should have correct date format',
          property: 'DATE_FORMAT', 
          expected: 'date-time',
        },
      ];

      test.each(validConstantTests)('$name', ({ property, expected }) => {
        expect(ROUTE_CONSTANTS[property as keyof typeof ROUTE_CONSTANTS]).toBe(expected);
      });

      const validResponseTypeTests = [
        { type: 'OBJECT', expected: 'object' },
        { type: 'ARRAY', expected: 'array' }, 
        { type: 'STRING', expected: 'string' },
        { type: 'NUMBER', expected: 'number' },
      ];

      test.each(validResponseTypeTests)('should have correct response type for $type', ({ type, expected }) => {
        expect(ROUTE_CONSTANTS.RESPONSE_TYPES[type as keyof typeof ROUTE_CONSTANTS.RESPONSE_TYPES]).toBe(expected);
      });

      it('should have valid minimum ID length', () => {
        expect(ROUTE_CONSTANTS.MIN_ID_LENGTH).toBe(1);
        expect(ROUTE_CONSTANTS.MIN_ID_LENGTH).toBeGreaterThan(0);
      });
    });
  });

  describe('commonParams', () => {
    describe('Valid parameter schemas', () => {
      it('should have correct agentId parameter structure', () => {
        const agentIdParam = commonParams.agentId;
        
        expect(agentIdParam.type).toBe('object');
        expect(agentIdParam.properties.id.type).toBe('string');
        expect(agentIdParam.properties.id.minLength).toBe(1);
        expect(agentIdParam.required).toContain('id');
      });

      it('should validate minimum length constraint', () => {
        expect(commonParams.agentId.properties.id.minLength).toBeGreaterThan(0);
      });
    });
  });

  describe('agentDataSchema', () => {
    describe('Valid schema structure', () => {
      it('should have correct base structure', () => {
        expect(agentDataSchema.type).toBe('object');
        expect(agentDataSchema.properties).toBeDefined();
        expect(agentDataSchema.required).toBeDefined();
      });

      const validPropertyTests = [
        { property: 'id', expectedType: 'string', hasFormat: false },
        { property: 'name', expectedType: 'string', hasFormat: false },
        { property: 'prompt', expectedType: 'string', hasFormat: false },
        { property: 'voiceId', expectedType: 'string', hasFormat: false },
        { property: 'language', expectedType: 'string', hasFormat: false },
        { property: 'model', expectedType: 'string', hasFormat: false },
        { property: 'temperature', expectedType: 'number', hasFormat: false },
        { property: 'maxTokens', expectedType: 'number', hasFormat: false },
        { property: 'createdAt', expectedType: 'string', hasFormat: true, format: 'date-time' },
        { property: 'updatedAt', expectedType: 'string', hasFormat: true, format: 'date-time' },
      ];

      test.each(validPropertyTests)(
        'should have property $property with correct type and format',
        ({ property, expectedType, hasFormat, format }) => {
          const properties = agentDataSchema.properties;
          
          expect(properties).toHaveProperty(property);
          expect(properties[property as keyof typeof properties].type).toBe(expectedType);
          
          if (hasFormat) {
            expect(properties[property as keyof typeof properties]).toHaveProperty('format', format);
          }
        }
      );

      it('should have correct required fields', () => {
        const expectedRequired = ['id', 'name', 'prompt', 'createdAt', 'updatedAt'];
        expect(agentDataSchema.required).toEqual(expectedRequired);
      });
    });

    describe('Edge cases', () => {
      it('should include all required fields in properties', () => {
        const requiredFields = agentDataSchema.required;
        const properties = Object.keys(agentDataSchema.properties);
        
        requiredFields.forEach(field => {
          expect(properties).toContain(field);
        });
      });

      it('should have more properties than required fields', () => {
        expect(Object.keys(agentDataSchema.properties).length).toBeGreaterThan(agentDataSchema.required.length);
      });
    });
  });

  describe('responseWrappers', () => {
    describe('Valid cases', () => {
      const validSuccessWrapperTests = [
        {
          name: 'should handle simple string data schema',
          dataSchema: { type: 'string' },
          description: 'simple string schema',
        },
        {
          name: 'should handle complex array data schema',
          dataSchema: { 
            type: 'array',
            items: { type: 'object', properties: { test: { type: 'string' } } }
          },
          description: 'complex array schema',
        },
        {
          name: 'should handle nested object data schema',
          dataSchema: {
            type: 'object',
            properties: {
              nested: { type: 'object', properties: { value: { type: 'number' } } }
            }
          },
          description: 'nested object schema',
        },
        {
          name: 'should handle agent data schema',
          dataSchema: agentDataSchema,
          description: 'full agent data schema',
        },
      ];

      test.each(validSuccessWrapperTests)('$name', ({ dataSchema }) => {
        const wrapper = responseWrappers.success(dataSchema);
        
        expect(wrapper.type).toBe('object');
        expect(wrapper.properties.data).toEqual(dataSchema);
        expect(wrapper.properties.message.type).toBe('string');
        expect(wrapper.required).toContain('data');
      });

      const validErrorStatusCodes = [
        { code: HTTP_STATUS.BAD_REQUEST, description: 'Bad Request' },
        { code: HTTP_STATUS.NOT_FOUND, description: 'Not Found' },
        { code: HTTP_STATUS.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' },
      ];

      test.each(validErrorStatusCodes)(
        'should create valid error wrapper for $code ($description)',
        ({ code }) => {
          const errorWrapper = agentErrorSchemas[code as keyof typeof agentErrorSchemas];
          
          expect(errorWrapper).toBeDefined();
          expect(errorWrapper.type).toBe('object');
          expect(errorWrapper.properties.error.type).toBe('object');
          expect(errorWrapper.properties.error.properties.message.type).toBe('string');
          expect(errorWrapper.properties.error.properties.code.type).toBe('string');
          expect(errorWrapper.properties.error.properties.timestamp.type).toBe('string');
          expect(errorWrapper.properties.error.properties.timestamp.format).toBe('date-time');
        }
      );
    });

    describe('Edge cases', () => {
      const edgeCaseTests = [
        {
          name: 'should handle null data schema',
          dataSchema: null,
          expectedData: null,
        },
        {
          name: 'should handle undefined data schema', 
          dataSchema: undefined,
          expectedData: undefined,
        },
        {
          name: 'should handle empty object data schema',
          dataSchema: {},
          expectedData: {},
        },
      ];

      test.each(edgeCaseTests)('$name', ({ dataSchema, expectedData }) => {
        const wrapper = responseWrappers.success(dataSchema);
        
        expect(wrapper.type).toBe('object');
        expect(wrapper.properties.data).toEqual(expectedData);
        expect(wrapper.properties.message.type).toBe('string');
        expect(wrapper.required).toContain('data');
      });

      it('should have consistent error schema structure across all status codes', () => {
        const errorSchemas = Object.values(agentErrorSchemas);
        
        errorSchemas.forEach(errorSchema => {
          expect(errorSchema.type).toBe('object');
          expect(errorSchema.properties.error.type).toBe('object');
          expect(errorSchema.properties.error.properties.message.type).toBe('string');
          expect(errorSchema.properties.error.properties.code.type).toBe('string');
          expect(errorSchema.properties.error.properties.timestamp.type).toBe('string');
          expect(errorSchema.properties.error.properties.timestamp.format).toBe('date-time');
        });
      });
    });
  });

  describe('agentSchemas', () => {
    describe('Valid schema structures', () => {
      const validSchemaTests = [
        {
          name: 'listAgents',
          schema: agentSchemas.listAgents,
          expectedSummary: 'List all agents',
          expectedDescription: 'Retrieve a list of all available Retell AI agents',
          hasParams: false,
          responseKeys: [HTTP_STATUS.OK.toString(), HTTP_STATUS.INTERNAL_SERVER_ERROR.toString()],
          dataType: 'array',
        },
        {
          name: 'getAgent', 
          schema: agentSchemas.getAgent,
          expectedSummary: 'Get agent by ID',
          expectedDescription: 'Retrieve a specific agent by its ID',
          hasParams: true,
          responseKeys: [HTTP_STATUS.OK.toString(), HTTP_STATUS.NOT_FOUND.toString(), HTTP_STATUS.BAD_REQUEST.toString(), HTTP_STATUS.INTERNAL_SERVER_ERROR.toString()],
          dataType: 'object',
        },
        {
          name: 'getAgentPrompt',
          schema: agentSchemas.getAgentPrompt, 
          expectedSummary: 'Get agent prompt',
          expectedDescription: 'Retrieve the system prompt for a specific agent',
          hasParams: true,
          responseKeys: [HTTP_STATUS.OK.toString(), HTTP_STATUS.NOT_FOUND.toString(), HTTP_STATUS.BAD_REQUEST.toString(), HTTP_STATUS.INTERNAL_SERVER_ERROR.toString()],
          dataType: 'object',
        },
      ];

      test.each(validSchemaTests)(
        'should have correct structure for $name endpoint',
        ({ schema, expectedSummary, expectedDescription, hasParams, responseKeys }) => {
          expect(schema.tags).toContain('Agents');
          expect(schema.summary).toBe(expectedSummary);
          expect(schema.description).toBe(expectedDescription);
          
          responseKeys.forEach(key => {
            expect(schema.response).toHaveProperty(key);
          });
          
          if (hasParams) {
            expect('params' in schema ? schema.params : undefined).toEqual(commonParams.agentId);
          } else {
            expect('params' in schema).toBe(false);
          }
        }
      );

      const responseStructureTests = [
        {
          name: 'listAgents should have array data response',
          schema: agentSchemas.listAgents,
          expectedDataType: 'array',
          expectedItems: agentDataSchema,
        },
        {
          name: 'getAgent should have object data response',
          schema: agentSchemas.getAgent,
          expectedDataType: 'object',
          expectedData: agentDataSchema,
        },
      ];

      test.each(responseStructureTests)(
        '$name',
        ({ schema, expectedDataType, expectedItems, expectedData }) => {
          const responseSchema = schema.response[HTTP_STATUS.OK];
          const dataSchema = responseSchema.properties.data;
          
          expect(dataSchema.type).toBe(expectedDataType);
          
          if (expectedItems && 'items' in dataSchema) {
            expect(dataSchema.items).toEqual(expectedItems);
          }
          
          if (expectedData) {
            expect(dataSchema).toEqual(expectedData);
          }
        }
      );

      it('should have specific prompt response structure', () => {
        const responseSchema = agentSchemas.getAgentPrompt.response[HTTP_STATUS.OK];
        const dataSchema = responseSchema.properties.data;
        
        const expectedProperties = [
          { name: 'agentId', type: 'string', hasFormat: false },
          { name: 'prompt', type: 'string', hasFormat: false },
          { name: 'version', type: 'number', hasFormat: false },
          { name: 'updatedAt', type: 'string', hasFormat: true, format: 'date-time' },
        ];
        
        expectedProperties.forEach(({ name, type, hasFormat, format }) => {
          expect(dataSchema.properties[name as keyof typeof dataSchema.properties].type).toBe(type);
          if (hasFormat) {
            expect(dataSchema.properties[name as keyof typeof dataSchema.properties]).toHaveProperty('format', format);
          }
        });
        
        expect(dataSchema.required).toEqual(['agentId', 'prompt', 'updatedAt']);
      });
    });

    describe('Schema consistency', () => {
      const consistencyTests = [
        {
          name: 'should have consistent tag usage across all schemas',
          testFn: () => {
            const schemas = Object.values(agentSchemas);
            schemas.forEach(schema => {
              expect(schema.tags).toContain(ROUTE_CONSTANTS.TAG);
            });
          },
        },
        {
          name: 'should have meaningful summaries for all schemas',
          testFn: () => {
            const schemas = Object.values(agentSchemas);
            schemas.forEach(schema => {
              expect(schema.summary).toBeDefined();
              expect(schema.summary.length).toBeGreaterThan(0);
            });
          },
        },
        {
          name: 'should have descriptions for all schemas',
          testFn: () => {
            const schemas = Object.values(agentSchemas);
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

    describe('Error response consistency', () => {
      it('should have consistent error response structure', () => {
        // Test that schemas with error responses include expected status codes
        const getAgentResponse = agentSchemas.getAgent.response;
        const getAgentPromptResponse = agentSchemas.getAgentPrompt.response;
        
        expect(getAgentResponse).toHaveProperty(HTTP_STATUS.NOT_FOUND.toString());
        expect(getAgentPromptResponse).toHaveProperty(HTTP_STATUS.NOT_FOUND.toString());
        expect(getAgentResponse).toHaveProperty(HTTP_STATUS.BAD_REQUEST.toString());
        expect(getAgentPromptResponse).toHaveProperty(HTTP_STATUS.BAD_REQUEST.toString());
        expect(getAgentResponse).toHaveProperty(HTTP_STATUS.INTERNAL_SERVER_ERROR.toString());
        expect(getAgentPromptResponse).toHaveProperty(HTTP_STATUS.INTERNAL_SERVER_ERROR.toString());
        
        // Test the error response structure using agentErrorSchemas
        const notFoundError = agentErrorSchemas[HTTP_STATUS.NOT_FOUND];
        expect(notFoundError.type).toBe('object');
        expect(notFoundError.properties.error).toBeDefined();
        expect(notFoundError.properties.error.properties.message.type).toBe('string');
        expect(notFoundError.properties.error.properties.code.type).toBe('string');
        expect(notFoundError.properties.error.properties.timestamp.type).toBe('string');
        expect(notFoundError.properties.error.properties.timestamp.format).toBe('date-time');
      });
    });
  });

  describe('Type consistency validation', () => {
    const typeConsistencyTests = [
      {
        name: 'should use ROUTE_CONSTANTS for agentDataSchema type definitions',
        testFn: () => {
          expect(agentDataSchema.type).toBe(ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT);
          expect(agentDataSchema.properties.id.type).toBe(ROUTE_CONSTANTS.RESPONSE_TYPES.STRING);
          expect(agentDataSchema.properties.temperature.type).toBe(ROUTE_CONSTANTS.RESPONSE_TYPES.NUMBER);
        },
      },
      {
        name: 'should use consistent date format across schemas',
        testFn: () => {
          const dateFields = [agentDataSchema.properties.createdAt, agentDataSchema.properties.updatedAt];
          dateFields.forEach(field => {
            expect(field.format).toBe(ROUTE_CONSTANTS.DATE_FORMAT);
          });
        },
      },
      {
        name: 'should use same parameter schema for ID-based endpoints',
        testFn: () => {
          expect(agentSchemas.getAgent.params).toEqual(commonParams.agentId);
          expect(agentSchemas.getAgentPrompt.params).toEqual(commonParams.agentId);
        },
      },
      {
        name: 'should maintain referential integrity with ROUTE_CONSTANTS',
        testFn: () => {
          Object.values(agentSchemas).forEach(schema => {
            expect(schema.tags).toContain(ROUTE_CONSTANTS.TAG);
          });
        },
      },
      {
        name: 'should use minimum length from constants',
        testFn: () => {
          expect(commonParams.agentId.properties.id.minLength).toBe(ROUTE_CONSTANTS.MIN_ID_LENGTH);
        },
      },
    ];

    test.each(typeConsistencyTests)('$name', ({ testFn }) => {
      testFn();
    });
  });

  describe('Invalid cases', () => {
    describe('Error schema validation', () => {
      it('should ensure all error schemas have consistent structure', () => {
        const errorSchemas = Object.values(agentErrorSchemas);
        
        errorSchemas.forEach(errorSchema => {
          expect(errorSchema.type).toBe('object');
          expect(errorSchema.required).toContain('error');
          expect(errorSchema.properties.error.type).toBe('object');
          expect(errorSchema.properties.error.required).toEqual(['message', 'code', 'timestamp']);
        });
      });
    });

    describe('Schema structure validation', () => {
      it('should ensure all required properties exist in agentDataSchema', () => {
        const requiredFields = agentDataSchema.required;
        const availableProperties = Object.keys(agentDataSchema.properties);
        
        requiredFields.forEach(field => {
          expect(availableProperties).toContain(field);
        });
      });

      it('should ensure parameter schemas have required constraints', () => {
        const agentIdParam = commonParams.agentId;
        
        expect(agentIdParam.required).toContain('id');
        expect(agentIdParam.properties.id).toHaveProperty('minLength');
        expect(agentIdParam.properties.id.minLength).toBeGreaterThan(0);
      });
    });
  });
});