import { IJobInfo, IJobExecutor } from "@concord-consortium/interactive-api-host";

const QUEUED_TO_RUNNING_DELAY = 500;
const RUNNING_TO_FINAL_DELAY = 1500;

interface ITaskConfig {
  finalStatus: "success" | "failure";
  defaultProcessingMessage: string;
  defaultMessage: string;
}

const taskConfigs: Record<string, ITaskConfig> = {
  success: {
    finalStatus: "success",
    defaultProcessingMessage: "Submitting your work\u2026",
    defaultMessage: "Great! Your teacher will be notified that you have submitted your work.",
  },
  failure: {
    finalStatus: "failure",
    defaultProcessingMessage: "Checking your answers\u2026",
    defaultMessage: "Sorry, you haven't finished answering all the questions. Go back and check your answers. Then return here and click this button again.",
  },
};

let nextJobId = 1;

export class MockJobExecutor implements IJobExecutor {
  private jobs: IJobInfo[] = [];
  private pendingTimeouts: Map<string, ReturnType<typeof setTimeout>[]> = new Map();
  private updateCallback: ((job: IJobInfo) => void) | null = null;

  createJob(request: { task: string } & Record<string, any>, _context?: Record<string, any>): Promise<IJobInfo> {
    const taskConfig = taskConfigs[request.task];
    const now = Date.now();
    const id = `mock-job-${nextJobId++}`;

    if (!taskConfig) {
      // Unknown task — immediate failure, no transitions
      const failedJob: IJobInfo = {
        version: 1,
        id,
        status: "failure",
        request,
        result: { message: `Unknown task: ${request.task}` },
        createdAt: now,
        completedAt: now,
      };
      this.jobs.push(failedJob);
      return Promise.resolve(failedJob);
    }

    const processingMessage = request.processingMessage ?? taskConfig.defaultProcessingMessage;
    const message = request.message ?? taskConfig.defaultMessage;

    const job: IJobInfo = {
      version: 1,
      id,
      status: "queued",
      request,
      createdAt: now,
    };
    this.jobs.push(job);

    // Schedule queued → running
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => {
      this.updateJob(id, {
        status: "running",
        updatedAt: Date.now(),
        startedAt: Date.now(),
        result: { message: "", processingMessage },
      });
    }, QUEUED_TO_RUNNING_DELAY));

    // Schedule running → final
    timeouts.push(setTimeout(() => {
      this.updateJob(id, {
        status: taskConfig.finalStatus,
        updatedAt: Date.now(),
        completedAt: Date.now(),
        result: { message },
      });
      this.pendingTimeouts.delete(id);
    }, QUEUED_TO_RUNNING_DELAY + RUNNING_TO_FINAL_DELAY));

    this.pendingTimeouts.set(id, timeouts);

    return Promise.resolve(job);
  }

  cancelJob(jobId: string): Promise<void> {
    // Only cancel jobs that are still in progress
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || (job.status !== "queued" && job.status !== "running")) {
      return Promise.resolve();
    }

    // Clear pending timeouts
    const timeouts = this.pendingTimeouts.get(jobId);
    if (timeouts) {
      timeouts.forEach(t => clearTimeout(t));
      this.pendingTimeouts.delete(jobId);
    }

    this.updateJob(jobId, {
      status: "cancelled",
      updatedAt: Date.now(),
      completedAt: Date.now(),
    });

    return Promise.resolve();
  }

  getJobs(_context?: Record<string, any>): Promise<IJobInfo[]> {
    return Promise.resolve([...this.jobs]);
  }

  onJobUpdate(callback: (job: IJobInfo) => void): void {
    this.updateCallback = callback;
  }

  private updateJob(jobId: string, updates: Partial<IJobInfo>): void {
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index === -1) {
      return;
    }
    const updated = { ...this.jobs[index], ...updates };
    this.jobs[index] = updated;
    this.updateCallback?.(updated);
  }
}
