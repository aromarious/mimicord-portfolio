import pino from "pino"

export interface LoggerOptions {
  name?: string
  level?: "debug" | "info" | "warn" | "error"
  pretty?: boolean
}

export interface LogContext {
  requestId?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Create a structured logger instance
 * @param options - Logger configuration options
 * @returns Pino logger instance
 */
export function createLogger(options: LoggerOptions = {}) {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isTest = process.env.NODE_ENV === "test"

  return pino({
    name: options.name || "mimicord",
    level: options.level || (isDevelopment ? "debug" : "info"),
    // Add base fields to all logs
    base: {
      service: options.name || "web",
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    },
    // Disable logging in test environment
    enabled: !isTest,
    // Pretty print in development if requested
    transport:
      (options.pretty ?? isDevelopment)
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  })
}

export type Logger = ReturnType<typeof createLogger>
