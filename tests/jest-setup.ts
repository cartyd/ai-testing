// Jest setup file
// This file runs after Jest is initialized

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during testing (unless debugging)
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}