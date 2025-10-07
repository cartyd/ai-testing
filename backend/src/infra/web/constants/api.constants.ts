/**
 * API metadata constants for OpenAPI/Swagger documentation
 */
export const API_METADATA = {
  OPENAPI_VERSION: '3.0.0',
  TITLE: 'Retell AI API',
  DESCRIPTION: 'REST API for Retell AI agent management',
  VERSION: '1.0.0',
  CONTACT_NAME: 'API Support',
  TAGS: [
    { name: 'Agents', description: 'Agent management endpoints' },
    { name: 'Health', description: 'Health check endpoints' },
  ],
};

/**
 * Root API response constants
 */
export const ROOT_RESPONSE = {
  MESSAGE: 'Retell AI API is running',
  VERSION: '1.0.0',
} as const;
