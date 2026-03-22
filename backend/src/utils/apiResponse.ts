export const ok = <T>(data: T, requestId?: string) => ({
  success: true,
  data,
  error: null,
  requestId: requestId ?? null,
  timestamp: new Date().toISOString(),
});

export const fail = (error: string, code = "ERROR", requestId?: string, details?: unknown) => ({
  success: false,
  data: null,
  error: { message: error, code, details: details ?? null },
  requestId: requestId ?? null,
  timestamp: new Date().toISOString(),
});
