/**
 * Unit tests for logger - Structured JSON logging with pino
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Hoist mocks for vitest
const { mockPino, mockChildLogger } = vi.hoisted(() => {
  const mockChild = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };

  // Make child return itself for chaining
  mockChild.child.mockReturnValue(mockChild);

  return {
    mockPino: vi.fn(() => mockChild),
    mockChildLogger: mockChild,
  };
});

// Mock pino
vi.mock("pino", () => ({
  default: mockPino,
}));

import {
  logger,
  createRequestLogger,
  redactSensitiveData,
} from "@/lib/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env["NODE_ENV"];
  });

  describe("logger initialization", () => {
    it("creates a logger instance", () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it("has child method for context", () => {
      expect(logger.child).toBeDefined();
      expect(typeof logger.child).toBe("function");
    });
  });

  describe("log levels", () => {
    it("logs debug messages", () => {
      logger.debug("Debug message");

      expect(mockChildLogger.debug).toHaveBeenCalledWith("Debug message");
    });

    it("logs info messages", () => {
      logger.info("Info message");

      expect(mockChildLogger.info).toHaveBeenCalledWith("Info message");
    });

    it("logs warn messages", () => {
      logger.warn("Warning message");

      expect(mockChildLogger.warn).toHaveBeenCalledWith("Warning message");
    });

    it("logs error messages", () => {
      logger.error("Error message");

      expect(mockChildLogger.error).toHaveBeenCalledWith("Error message");
    });

    it("logs with additional context", () => {
      logger.info({ userId: "user-1", action: "login" }, "User logged in");

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        { userId: "user-1", action: "login" },
        "User logged in"
      );
    });

    it("logs error objects", () => {
      const error = new Error("Test error");

      logger.error({ err: error }, "Operation failed");

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        { err: error },
        "Operation failed"
      );
    });
  });

  describe("child logger", () => {
    it("creates child logger with context", () => {
      const childLogger = logger.child({ service: "auth" });

      expect(mockChildLogger.child).toHaveBeenCalledWith({ service: "auth" });
      expect(childLogger).toBeDefined();
    });

    it("child logger inherits parent context", () => {
      const childLogger = logger.child({ service: "auth" });
      childLogger.info("Auth event");

      expect(mockChildLogger.info).toHaveBeenCalledWith("Auth event");
    });

    it("supports nested child loggers", () => {
      mockChildLogger.child.mockReturnValue(mockChildLogger);

      const authLogger = logger.child({ service: "auth" });
      const loginLogger = authLogger.child({ action: "login" });

      expect(mockChildLogger.child).toHaveBeenCalledTimes(2);
      expect(loginLogger).toBeDefined();
    });
  });

  describe("createRequestLogger", () => {
    it("creates a request logger with request ID", () => {
      const requestId = "req-123";

      const requestLogger = createRequestLogger(requestId);

      expect(mockChildLogger.child).toHaveBeenCalledWith({
        requestId: "req-123",
      });
      expect(requestLogger).toBeDefined();
    });

    it("generates request ID if not provided", () => {
      const requestLogger = createRequestLogger();

      expect(mockChildLogger.child).toHaveBeenCalledWith({
        requestId: expect.stringMatching(/^req-/),
      });
      expect(requestLogger).toBeDefined();
    });

    it("creates request logger with additional context", () => {
      const requestLogger = createRequestLogger("req-123", {
        userId: "user-1",
        path: "/api/users",
      });

      expect(mockChildLogger.child).toHaveBeenCalledWith({
        requestId: "req-123",
        userId: "user-1",
        path: "/api/users",
      });
    });
  });

  describe("redactSensitiveData", () => {
    it("redacts password field", () => {
      const data = {
        email: "test@example.com",
        password: "secret123",
        name: "Test User",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        email: "test@example.com",
        password: "[REDACTED]",
        name: "Test User",
      });
    });

    it("redacts token field", () => {
      const data = {
        userId: "user-1",
        token: "secret-token",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        userId: "user-1",
        token: "[REDACTED]",
      });
    });

    it("redacts multiple sensitive fields", () => {
      const data = {
        email: "test@example.com",
        password: "secret123",
        apiKey: "sk_test_123",
        secret: "my-secret",
        creditCard: "4242-4242-4242-4242",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        email: "test@example.com",
        password: "[REDACTED]",
        apiKey: "[REDACTED]",
        secret: "[REDACTED]",
        creditCard: "[REDACTED]",
      });
    });

    it("redacts nested sensitive fields", () => {
      const data = {
        user: {
          email: "test@example.com",
          password: "secret123",
        },
        credentials: {
          token: "secret-token",
        },
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        user: {
          email: "test@example.com",
          password: "[REDACTED]",
        },
        credentials: {
          token: "[REDACTED]",
        },
      });
    });

    it("redacts sensitive fields in arrays", () => {
      const data = {
        users: [
          { email: "user1@example.com", password: "pass1" },
          { email: "user2@example.com", password: "pass2" },
        ],
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        users: [
          { email: "user1@example.com", password: "[REDACTED]" },
          { email: "user2@example.com", password: "[REDACTED]" },
        ],
      });
    });

    it("handles null and undefined values", () => {
      const data = {
        password: null,
        token: undefined,
        name: "Test",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        password: "[REDACTED]",
        token: "[REDACTED]",
        name: "Test",
      });
    });

    it("does not modify non-sensitive fields", () => {
      const data = {
        userId: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual(data);
    });

    it("handles empty objects", () => {
      const data = {};

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({});
    });

    it("redacts case-insensitive field names", () => {
      const data = {
        Password: "secret",
        TOKEN: "token123",
        ApiKey: "key123",
      };

      const redacted = redactSensitiveData(data);

      expect(redacted).toEqual({
        Password: "[REDACTED]",
        TOKEN: "[REDACTED]",
        ApiKey: "[REDACTED]",
      });
    });

    it("handles circular references gracefully", () => {
      const data: any = { name: "Test" };
      data.self = data;

      const redacted = redactSensitiveData(data);

      expect(redacted.name).toBe("Test");
      expect(redacted.self).toBe("[Circular]");
    });

    it("redacts common sensitive field names", () => {
      const data = {
        password: "pass",
        token: "tok",
        secret: "sec",
        apiKey: "key",
        accessToken: "access",
        refreshToken: "refresh",
        privateKey: "private",
        clientSecret: "client",
        stripeSecretKey: "stripe",
        sessionToken: "session",
      };

      const redacted = redactSensitiveData(data);

      const allRedacted = Object.values(redacted).every(
        (v) => v === "[REDACTED]"
      );
      expect(allRedacted).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("logs server action with context", () => {
      const actionLogger = logger.child({
        service: "server-action",
        action: "createUser",
      });

      actionLogger.info({ userId: "user-1" }, "User created successfully");

      expect(mockChildLogger.child).toHaveBeenCalledWith({
        service: "server-action",
        action: "createUser",
      });
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        { userId: "user-1" },
        "User created successfully"
      );
    });

    it("logs authentication events with redacted data", () => {
      const authLogger = logger.child({ service: "auth" });
      const loginData = {
        email: "test@example.com",
        password: "secret123",
      };

      const redacted = redactSensitiveData(loginData);
      authLogger.info({ data: redacted }, "Login attempt");

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        {
          data: {
            email: "test@example.com",
            password: "[REDACTED]",
          },
        },
        "Login attempt"
      );
    });

    it("logs errors with stack trace", () => {
      const error = new Error("Database connection failed");
      const errorLogger = logger.child({ service: "database" });

      errorLogger.error({ err: error }, "Database error occurred");

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        { err: error },
        "Database error occurred"
      );
    });

    it("logs webhook processing with request ID", () => {
      const requestLogger = createRequestLogger("req-webhook-123", {
        service: "stripe",
        event: "invoice.payment_succeeded",
      });

      requestLogger.info("Processing webhook");

      expect(mockChildLogger.child).toHaveBeenCalledWith({
        requestId: "req-webhook-123",
        service: "stripe",
        event: "invoice.payment_succeeded",
      });
      expect(mockChildLogger.info).toHaveBeenCalledWith("Processing webhook");
    });
  });

  describe("error handling", () => {
    it("logger methods are callable", () => {
      // Logger methods should be defined and callable
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("handles complex data structures", () => {
      // Pino handles various data types
      const complexData = {
        array: [1, 2, 3],
        nested: { foo: "bar" },
        number: 42,
        boolean: true,
        nullValue: null,
      };

      expect(() => logger.info(complexData, "Test")).not.toThrow();
    });
  });
});
