import { 
  createHealthHandlers,
  type TimeProvider,
  type ServiceChecker,
  type HealthHandlers
} from '../../../src/infra/web/controllers/health.controller';
import { HTTP_STATUS, HEALTH_CONFIG, HEALTH_MESSAGES, COMMON_MESSAGES } from '../../../src/infra/web/constants/controller.constants';
import type { FastifyReply } from 'fastify';

// Test constants
const TEST_CONSTANTS = {
  MOCK_TIMESTAMP: '2023-01-01T10:00:00.000Z',
  MOCK_UPTIME: 3600,
  MOCK_RESPONSE_TIME: 42.5,
  ERROR_MESSAGES: {
    DEPENDENCIES: 'Service dependencies are not ready',
    TIMEOUT: 'Connection timeout occurred',
    NETWORK: 'Network connection failed',
    GENERIC: 'Something went wrong',
  },
} as const;

// Mock implementations
const mockTimeProvider: jest.Mocked<TimeProvider> = {
  now: jest.fn(() => TEST_CONSTANTS.MOCK_TIMESTAMP),
  uptime: jest.fn(() => TEST_CONSTANTS.MOCK_UPTIME),
};

const mockServiceChecker: jest.Mocked<ServiceChecker> = {
  checkAllServices: jest.fn(),
};

// Mock Fastify reply
const createMockReply = (): jest.Mocked<FastifyReply> => ({
  code: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  header: jest.fn().mockReturnThis(),
} as any);

describe('Health Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHealthHandlers - Factory Function', () => {
    it('should create handlers with default dependencies', () => {
      const handlers = createHealthHandlers();
      
      expect(handlers).toHaveProperty('getHealth');
      expect(handlers).toHaveProperty('getReadiness');
      expect(handlers).toHaveProperty('getLiveness');
      expect(typeof handlers.getHealth).toBe('function');
      expect(typeof handlers.getReadiness).toBe('function');
      expect(typeof handlers.getLiveness).toBe('function');
    });

    it('should create handlers with custom dependencies', () => {
      const handlers = createHealthHandlers({
        serviceChecker: mockServiceChecker,
        timeProvider: mockTimeProvider,
      });
      
      expect(handlers).toHaveProperty('getHealth');
      expect(handlers).toHaveProperty('getReadiness');
      expect(handlers).toHaveProperty('getLiveness');
    });
  });

  describe('getHealth handler', () => {
    let handlers: HealthHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createHealthHandlers({
        serviceChecker: mockServiceChecker,
        timeProvider: mockTimeProvider,
      });
      mockReply = createMockReply();
    });

    describe('Success scenarios', () => {
      it('should return healthy status when all services are up', async () => {
        // Arrange
        const mockServices = { [HEALTH_CONFIG.SERVICES.RETELL_AI]: 'up' as const };
        mockServiceChecker.checkAllServices.mockResolvedValue(mockServices);

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockServiceChecker.checkAllServices).toHaveBeenCalledTimes(1);
        expect(mockTimeProvider.now).toHaveBeenCalledTimes(1);
        expect(mockTimeProvider.uptime).toHaveBeenCalledTimes(1);
        expect(mockReply.header).toHaveBeenCalledWith(
          HEALTH_CONFIG.PERFORMANCE.RESPONSE_TIME_HEADER,
          expect.stringMatching(/^\d+\.\d{2}ms$/)
        );
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockReply.send).toHaveBeenCalledWith({
          status: 'healthy',
          timestamp: TEST_CONSTANTS.MOCK_TIMESTAMP,
          uptime: TEST_CONSTANTS.MOCK_UPTIME,
          services: mockServices,
        });
      });

      it('should return unhealthy status when some services are down', async () => {
        // Arrange
        const mockServices = { 
          [HEALTH_CONFIG.SERVICES.RETELL_AI]: 'down' as const,
          'database': 'up' as const
        };
        mockServiceChecker.checkAllServices.mockResolvedValue(mockServices);

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.send).toHaveBeenCalledWith({
          status: 'unhealthy',
          timestamp: TEST_CONSTANTS.MOCK_TIMESTAMP,
          uptime: TEST_CONSTANTS.MOCK_UPTIME,
          services: mockServices,
        });
      });

      it('should handle empty services list', async () => {
        // Arrange
        mockServiceChecker.checkAllServices.mockResolvedValue({});

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.send).toHaveBeenCalledWith({
          status: 'healthy', // No down services = healthy
          timestamp: TEST_CONSTANTS.MOCK_TIMESTAMP,
          uptime: TEST_CONSTANTS.MOCK_UPTIME,
          services: {},
        });
      });
    });

    describe('Error scenarios', () => {
      it('should handle service checker errors with 500 status', async () => {
        // Arrange
        const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.GENERIC);
        mockServiceChecker.checkAllServices.mockRejectedValue(error);

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: TEST_CONSTANTS.ERROR_MESSAGES.GENERIC,
        });
      });

      it('should handle dependency errors with 503 status', async () => {
        // Arrange
        const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.DEPENDENCIES);
        mockServiceChecker.checkAllServices.mockRejectedValue(error);

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: TEST_CONSTANTS.ERROR_MESSAGES.DEPENDENCIES,
        });
      });

      it('should handle timeout errors with 503 status', async () => {
        // Arrange
        const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT);
        mockServiceChecker.checkAllServices.mockRejectedValue(error);

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT,
        });
      });

      it('should handle non-Error objects', async () => {
        // Arrange
        mockServiceChecker.checkAllServices.mockRejectedValue('String error');

        // Act
        await handlers.getHealth({} as any, mockReply);

        // Assert
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: COMMON_MESSAGES.ERROR.HEALTH_CHECK_FAILED,
        });
      });
    });
  });

  describe('getReadiness handler', () => {
    let handlers: HealthHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createHealthHandlers();
      mockReply = createMockReply();
    });

    it('should return ready status for successful readiness check', async () => {
      // Act
      await handlers.getReadiness({} as any, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: HEALTH_CONFIG.STATUS_VALUES.READY,
      });
    });
  });

  describe('getLiveness handler', () => {
    let handlers: HealthHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createHealthHandlers();
      mockReply = createMockReply();
    });

    it('should return alive status for successful liveness check', async () => {
      // Act
      await handlers.getLiveness({} as any, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockReply.send).toHaveBeenCalledWith({
        status: HEALTH_CONFIG.STATUS_VALUES.ALIVE,
      });
    });
  });

  describe('Error Status Code Logic', () => {
    let handlers: HealthHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      // Use a failing service checker to test error handling
      const failingServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn(),
      };
      handlers = createHealthHandlers({ serviceChecker: failingServiceChecker });
      mockReply = createMockReply();
    });

    const testCases = [
      {
        description: 'should return 503 for dependency errors',
        error: new Error('Service dependencies are not working'),
        expectedStatus: HTTP_STATUS.SERVICE_UNAVAILABLE,
      },
      {
        description: 'should return 503 for ready-related errors',
        error: new Error('System not ready to serve requests'),
        expectedStatus: HTTP_STATUS.SERVICE_UNAVAILABLE,
      },
      {
        description: 'should return 503 for timeout errors',
        error: new Error('Request timeout exceeded'),
        expectedStatus: HTTP_STATUS.SERVICE_UNAVAILABLE,
      },
      {
        description: 'should return 503 for connection errors',
        error: new Error('Database connection failed'),
        expectedStatus: HTTP_STATUS.SERVICE_UNAVAILABLE,
      },
      {
        description: 'should return 500 for network errors (not matching pattern)',
        error: new Error('Network unreachable'),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      {
        description: 'should return 500 for generic errors',
        error: new Error('Something unexpected happened'),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      {
        description: 'should return 500 for errors without message',
        error: new Error(''),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    ];

    test.each(testCases)('$description', async ({ error, expectedStatus }) => {
      // Arrange
      const failingChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockRejectedValue(error)
      };
      const testHandlers = createHealthHandlers({ serviceChecker: failingChecker });
      const testMockReply = createMockReply();

      // Act
      await testHandlers.getHealth({} as any, testMockReply);

      // Assert
      expect(testMockReply.code).toHaveBeenCalledWith(expectedStatus);
      expect(testMockReply.send).toHaveBeenCalledWith({
        data: null,
        message: error.message,
      });
    });
  });

  describe('Service Health Determination Logic', () => {
    const testCases = [
      {
        description: 'should return healthy when all services are up',
        services: { 
          'service1': 'up' as const, 
          'service2': 'up' as const 
        },
        expectedStatus: 'healthy',
      },
      {
        description: 'should return unhealthy when any service is down',
        services: { 
          'service1': 'up' as const, 
          'service2': 'down' as const 
        },
        expectedStatus: 'unhealthy',
      },
      {
        description: 'should return unhealthy when all services are down',
        services: { 
          'service1': 'down' as const, 
          'service2': 'down' as const 
        },
        expectedStatus: 'unhealthy',
      },
      {
        description: 'should return healthy when no services are defined',
        services: {},
        expectedStatus: 'healthy',
      },
      {
        description: 'should return healthy for single up service',
        services: { 'service1': 'up' as const },
        expectedStatus: 'healthy',
      },
      {
        description: 'should return unhealthy for single down service',
        services: { 'service1': 'down' as const },
        expectedStatus: 'unhealthy',
      },
    ];

    test.each(testCases)('$description', async ({ services, expectedStatus }) => {
      // Arrange
      const mockServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockResolvedValue(services)
      };
      const handlers = createHealthHandlers({ 
        serviceChecker: mockServiceChecker,
        timeProvider: mockTimeProvider 
      });
      const mockReply = createMockReply();

      // Act
      await handlers.getHealth({} as any, mockReply);

      // Assert
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expectedStatus,
          services,
        })
      );
    });
  });

  describe('Response Time Calculation', () => {
    it('should include response time header in health responses', async () => {
      // Arrange
      const mockServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockResolvedValue({ 'service': 'up' })
      };
      const handlers = createHealthHandlers({ 
        serviceChecker: mockServiceChecker,
        timeProvider: mockTimeProvider 
      });
      const mockReply = createMockReply();

      // Act
      await handlers.getHealth({} as any, mockReply);

      // Assert
      expect(mockReply.header).toHaveBeenCalledWith(
        HEALTH_CONFIG.PERFORMANCE.RESPONSE_TIME_HEADER,
        expect.stringMatching(/^\d+\.\d{2}ms$/)
      );
    });

    it('should calculate response time correctly', async () => {
      // Note: This test verifies the pattern but can't test exact timing
      // due to the async nature and real hrtime usage
      const mockServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockResolvedValue({ 'service': 'up' })
      };
      const handlers = createHealthHandlers({ 
        serviceChecker: mockServiceChecker,
        timeProvider: mockTimeProvider 
      });
      const mockReply = createMockReply();

      // Act
      await handlers.getHealth({} as any, mockReply);

      // Assert
      const headerCall = mockReply.header.mock.calls.find(
        call => call[0] === HEALTH_CONFIG.PERFORMANCE.RESPONSE_TIME_HEADER
      );
      expect(headerCall).toBeDefined();
      expect(headerCall![1]).toMatch(/^\d+\.\d{2}ms$/);
      
      // Verify it's a reasonable response time (should be very fast in tests)
      const responseTimeStr = headerCall![1] as string;
      const responseTime = parseFloat(responseTimeStr.replace('ms', ''));
      expect(responseTime).toBeGreaterThanOrEqual(0);
      expect(responseTime).toBeLessThan(1000); // Should be under 1 second in tests
    });
  });

  describe('Dependency Injection', () => {
    it('should use custom time provider', async () => {
      // Arrange
      const customTimeProvider: jest.Mocked<TimeProvider> = {
        now: jest.fn(() => '2024-01-01T00:00:00.000Z'),
        uptime: jest.fn(() => 7200),
      };
      const mockServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockResolvedValue({ 'service': 'up' })
      };
      const handlers = createHealthHandlers({ 
        serviceChecker: mockServiceChecker,
        timeProvider: customTimeProvider 
      });
      const mockReply = createMockReply();

      // Act
      await handlers.getHealth({} as any, mockReply);

      // Assert
      expect(customTimeProvider.now).toHaveBeenCalledTimes(1);
      expect(customTimeProvider.uptime).toHaveBeenCalledTimes(1);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: '2024-01-01T00:00:00.000Z',
          uptime: 7200,
        })
      );
    });

    it('should use custom service checker', async () => {
      // Arrange
      const customServices = { 
        'custom-service': 'up' as const,
        'another-service': 'down' as const 
      };
      const customServiceChecker: jest.Mocked<ServiceChecker> = {
        checkAllServices: jest.fn().mockResolvedValue(customServices)
      };
      const handlers = createHealthHandlers({ 
        serviceChecker: customServiceChecker,
        timeProvider: mockTimeProvider 
      });
      const mockReply = createMockReply();

      // Act
      await handlers.getHealth({} as any, mockReply);

      // Assert
      expect(customServiceChecker.checkAllServices).toHaveBeenCalledTimes(1);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy', // Because one service is down
          services: customServices,
        })
      );
    });
  });
});