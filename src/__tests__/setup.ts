// Jest test setup file
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DB_URL = 'mongodb://localhost:27017/test_db';
process.env.ACCESS_TOKEN = 'test-access-token-secret-key-min-32-characters';
process.env.REFRESH_TOKEN = 'test-refresh-token-secret-key-min-32-characters';
process.env.RESET_SECRET = 'test-reset-token-secret-key-min-32-characters';
process.env.VERIFIED_TOKEN = 'test-verified-token-secret-key-min-32-characters';
process.env.ACCESS_EXPIRES = '15m';
process.env.REFRESH_EXPIRES = '7d';
process.env.RESET_EXPIRES = '10m';
process.env.FRONT_END_URL = 'http://localhost:3000';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
