// Test setup file
// This file runs before all modules are loaded

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'testing';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '0'; // Use random available port for tests
process.env.HOST = 'localhost';
process.env.RETELL_API_KEY = 'test_api_key';
process.env.RETELL_BASE_URL = 'https://api.retellai.com/v2';
process.env.API_TIMEOUT = '5000';
process.env.API_RETRY_ATTEMPTS = '1';
