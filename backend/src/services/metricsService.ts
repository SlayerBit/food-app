class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private totalLatencyMs = 0;
  private activeRequests = 0;

  beginRequest() {
    this.activeRequests += 1;
    this.requestCount += 1;
  }

  endRequest() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  incrementError() {
    this.errorCount += 1;
  }

  observeLatency(ms: number) {
    this.totalLatencyMs += ms;
  }

  snapshot() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageLatencyMs:
        this.requestCount === 0 ? 0 : Number((this.totalLatencyMs / this.requestCount).toFixed(2)),
      activeRequests: this.activeRequests,
    };
  }
}

export const metricsService = new MetricsService();
