type Level = "INFO" | "ERROR" | "WARN";

export const logger = {
  log(level: Level, message: string, meta?: unknown, requestId?: string) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: requestId ?? null,
      meta: meta ?? null,
    };
    console.log(JSON.stringify(payload));
  },
  info(message: string, meta?: unknown, requestId?: string) {
    this.log("INFO", message, meta, requestId);
  },
  warn(message: string, meta?: unknown, requestId?: string) {
    this.log("WARN", message, meta, requestId);
  },
  error(message: string, meta?: unknown, requestId?: string) {
    this.log("ERROR", message, meta, requestId);
  },
};
