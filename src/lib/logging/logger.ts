type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, payload?: LogPayload) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  info: (message: string, payload?: LogPayload) => write("info", message, payload),
  warn: (message: string, payload?: LogPayload) => write("warn", message, payload),
  error: (message: string, payload?: LogPayload) => write("error", message, payload),
  debug: (message: string, payload?: LogPayload) => {
    if (process.env.NODE_ENV !== "production") write("debug", message, payload);
  },
  /**
   * Returns a child logger that automatically includes the given
   * requestId in every log entry. Use this at the top of route handlers
   * and server actions to correlate all log lines for one request:
   *
   *   const { headers } = await import("next/headers");
   *   const log = logger.withRequestId((await headers()).get("x-request-id") ?? "");
   *   log.info("Processing payment", { paymentId });
   */
  withRequestId(requestId: string) {
    return {
      info: (message: string, payload?: LogPayload) =>
        write("info", message, { requestId, ...payload }),
      warn: (message: string, payload?: LogPayload) =>
        write("warn", message, { requestId, ...payload }),
      error: (message: string, payload?: LogPayload) =>
        write("error", message, { requestId, ...payload }),
      debug: (message: string, payload?: LogPayload) => {
        if (process.env.NODE_ENV !== "production")
          write("debug", message, { requestId, ...payload });
      },
    };
  },
};