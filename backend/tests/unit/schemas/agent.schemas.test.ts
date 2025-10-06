import { 
  AGENT_ROUTE_PREFIX,
  agentSchemas,
} from '../../../src/infra/web/schemas/agent.schemas';
import { HTTP_STATUS } from '../../../src/infra/web/constants/controller.constants';

describe('Agent Schema Tests', () => {
  describe('Route Constants', () => {
    it('should have correct API prefix', () => {
      expect(AGENT_ROUTE_PREFIX).toBe('/api/v1/agents');
    });
  });

  describe('Schema Structure', () => {
    it('should have all required schemas', () => {
      expect(agentSchemas.listAgents).toBeDefined();
      expect(agentSchemas.getAgent).toBeDefined();
      expect(agentSchemas.getAgentPrompt).toBeDefined();
    });

    it('should have correct tags and descriptions', () => {
      expect(agentSchemas.listAgents.tags).toEqual(['Agents']);
      expect(agentSchemas.listAgents.summary).toBe('List all agents');
      
      expect(agentSchemas.getAgent.tags).toEqual(['Agents']);
      expect(agentSchemas.getAgent.summary).toBe('Get agent by ID');
      
      expect(agentSchemas.getAgentPrompt.tags).toEqual(['Agents']);
      expect(agentSchemas.getAgentPrompt.summary).toBe('Get agent prompt');
    });

    it('should have required response status codes', () => {
      // All schemas should have OK responses
      expect(agentSchemas.listAgents.response[HTTP_STATUS.OK]).toBeDefined();
      expect(agentSchemas.getAgent.response[HTTP_STATUS.OK]).toBeDefined();
      expect(agentSchemas.getAgentPrompt.response[HTTP_STATUS.OK]).toBeDefined();
      
      // Parameterized endpoints should have error responses
      expect(agentSchemas.getAgent.response[HTTP_STATUS.NOT_FOUND]).toBeDefined();
      expect(agentSchemas.getAgent.response[HTTP_STATUS.BAD_REQUEST]).toBeDefined();
      expect(agentSchemas.getAgentPrompt.response[HTTP_STATUS.NOT_FOUND]).toBeDefined();
      expect(agentSchemas.getAgentPrompt.response[HTTP_STATUS.BAD_REQUEST]).toBeDefined();
      
      // All should have internal server error responses
      expect(agentSchemas.listAgents.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(agentSchemas.getAgent.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
      expect(agentSchemas.getAgentPrompt.response[HTTP_STATUS.INTERNAL_SERVER_ERROR]).toBeDefined();
    });

    it('should have correct parameter schemas for ID-based endpoints', () => {
      // Both getAgent and getAgentPrompt should have params
      expect(agentSchemas.getAgent.params).toBeDefined();
      expect(agentSchemas.getAgentPrompt.params).toBeDefined();
      
      // Cast to any to avoid TypeScript issues in tests
      const getAgentParams = agentSchemas.getAgent.params as any;
      const getPromptParams = agentSchemas.getAgentPrompt.params as any;
      
      expect(getAgentParams.type).toBe('object');
      expect(getAgentParams.properties.id.type).toBe('string');
      expect(getAgentParams.properties.id.minLength).toBe(1);
      
      expect(getPromptParams.type).toBe('object');
      expect(getPromptParams.properties.id.type).toBe('string');
    });
  });

  describe('Response Structure Validation', () => {
    it('should have consistent response wrapper structure', () => {
      // Check that responses are properly wrapped
      const listResponse = agentSchemas.listAgents.response[HTTP_STATUS.OK] as any;
      const getResponse = agentSchemas.getAgent.response[HTTP_STATUS.OK] as any;
      const promptResponse = agentSchemas.getAgentPrompt.response[HTTP_STATUS.OK] as any;
      
      // All success responses should be objects with data and message
      expect(listResponse.type).toBe('object');
      expect(listResponse.properties.data).toBeDefined();
      expect(listResponse.properties.message.type).toBe('string');
      expect(listResponse.required).toContain('data');
      
      expect(getResponse.type).toBe('object');
      expect(getResponse.properties.data).toBeDefined();
      expect(getResponse.properties.message.type).toBe('string');
      
      expect(promptResponse.type).toBe('object');
      expect(promptResponse.properties.data).toBeDefined();
      expect(promptResponse.properties.message.type).toBe('string');
    });

    it('should have consistent error response structure', () => {
      const errorResponse = agentSchemas.getAgent.response[HTTP_STATUS.NOT_FOUND] as any;
      
      expect(errorResponse.type).toBe('object');
      expect(errorResponse.properties.error).toBeDefined();
      expect(errorResponse.properties.error.type).toBe('object');
      expect(errorResponse.required).toContain('error');
    });
  });
});
