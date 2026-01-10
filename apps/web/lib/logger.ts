import { createLogger } from "@packages/logger"

/**
 * Application-wide logger instance
 * Configured for the web application
 */
export const logger = createLogger({
  name: "web",
  level: process.env.LOG_LEVEL as
    | "debug"
    | "info"
    | "warn"
    | "error"
    | undefined,
})
