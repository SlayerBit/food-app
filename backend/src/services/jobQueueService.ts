import { config } from "../config/config";
import { logger } from "../utils/logger";

type JobFn = () => Promise<void>;

type QueuedJob = {
  fn: JobFn;
  retries: number;
  maxRetries: number;
};

class JobQueueService {
  private queue: QueuedJob[] = [];
  private processing = false;
  private jobsProcessed = 0;
  private jobsFailed = 0;
  private recentFailures: Array<{ message: string; at: string }> = [];

  add(job: JobFn, options?: { delayMs?: number; maxRetries?: number }) {
    const maxRetries = options?.maxRetries ?? config.queue.jobMaxRetries;
    const run = () => {
      this.queue.push({ fn: job, retries: 0, maxRetries });
      void this.run();
    };
    if (options?.delayMs !== undefined && options.delayMs > 0) {
      setTimeout(run, options.delayMs);
      return;
    }
    run();
  }

  private async run() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;
      try {
        await job.fn();
        this.jobsProcessed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (job.retries < job.maxRetries) {
          job.retries += 1;
          this.queue.push(job);
        } else {
          this.jobsFailed += 1;
          this.recentFailures.push({ message, at: new Date().toISOString() });
          if (this.recentFailures.length > 50) this.recentFailures.shift();
          logger.error("job.failed_permanently", { message, retries: job.retries });
        }
      }
    }
    this.processing = false;
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      jobsProcessed: this.jobsProcessed,
      jobsFailed: this.jobsFailed,
      recentFailures: this.recentFailures.slice(-10),
    };
  }

  health() {
    return {
      ok: true,
      queueDepth: this.queue.length,
      processing: this.processing,
    };
  }
}

export const jobQueueService = new JobQueueService();
