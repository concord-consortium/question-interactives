import { MockJobExecutor } from "./mock-job-executor";

describe("MockJobExecutor", () => {
  let executor: MockJobExecutor;
  let onUpdate: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    executor = new MockJobExecutor();
    onUpdate = jest.fn();
    executor.onJobUpdate(onUpdate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("success task", () => {
    it("resolves with queued status immediately", async () => {
      const job = await executor.createJob({ task: "success" });
      expect(job.status).toBe("queued");
      expect(job.id).toBeDefined();
      expect(job.version).toBe(1);
      expect(job.createdAt).toBeDefined();
    });

    it("transitions to running after ~500ms", async () => {
      await executor.createJob({ task: "success" });
      jest.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "running",
          startedAt: expect.any(Number),
          result: expect.objectContaining({
            processingMessage: "Submitting your work\u2026",
          }),
        })
      );
    });

    it("transitions to success after ~2000ms total", async () => {
      await executor.createJob({ task: "success" });
      jest.advanceTimersByTime(2000);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          completedAt: expect.any(Number),
          result: expect.objectContaining({
            message: "Great! Your teacher will be notified that you have submitted your work.",
          }),
        })
      );
    });
  });

  describe("failure task", () => {
    it("transitions to failure after ~2000ms total", async () => {
      await executor.createJob({ task: "failure" });
      jest.advanceTimersByTime(2000);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failure",
          result: expect.objectContaining({
            message: expect.stringContaining("haven't finished"),
          }),
        })
      );
    });

    it("shows correct processing message during running phase", async () => {
      await executor.createJob({ task: "failure" });
      jest.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "running",
          result: expect.objectContaining({
            processingMessage: "Checking your answers\u2026",
          }),
        })
      );
    });
  });

  describe("unknown task", () => {
    it("resolves immediately with failure status", async () => {
      const job = await executor.createJob({ task: "unknown-task" });
      expect(job.status).toBe("failure");
      expect(job.result?.message).toBe("Unknown task: unknown-task");
      expect(job.completedAt).toBeDefined();
    });

    it("does not emit any onJobUpdate callbacks", async () => {
      await executor.createJob({ task: "unknown-task" });
      jest.advanceTimersByTime(5000);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("custom message overrides", () => {
    it("uses custom processingMessage when provided", async () => {
      await executor.createJob({ task: "success", processingMessage: "Custom processing..." });
      jest.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          result: expect.objectContaining({
            processingMessage: "Custom processing...",
          }),
        })
      );
    });

    it("uses custom message when provided", async () => {
      await executor.createJob({ task: "success", message: "Custom result!" });
      jest.advanceTimersByTime(2000);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          result: expect.objectContaining({
            message: "Custom result!",
          }),
        })
      );
    });
  });

  describe("cancelJob", () => {
    it("transitions job to cancelled status", async () => {
      const job = await executor.createJob({ task: "success" });
      await executor.cancelJob(job.id);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          completedAt: expect.any(Number),
        })
      );
    });

    it("clears pending timeouts so no further transitions occur", async () => {
      const job = await executor.createJob({ task: "success" });
      await executor.cancelJob(job.id);
      onUpdate.mockClear();
      jest.advanceTimersByTime(5000);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("getJobs", () => {
    it("returns empty array on fresh executor", async () => {
      const jobs = await executor.getJobs();
      expect(jobs).toEqual([]);
    });

    it("returns created jobs within session", async () => {
      await executor.createJob({ task: "success" });
      await executor.createJob({ task: "failure" });
      const jobs = await executor.getJobs();
      expect(jobs).toHaveLength(2);
      expect(jobs[0].request.task).toBe("success");
      expect(jobs[1].request.task).toBe("failure");
    });

    it("returns jobs with updated status after transitions", async () => {
      await executor.createJob({ task: "success" });
      jest.advanceTimersByTime(2000);
      const jobs = await executor.getJobs();
      expect(jobs[0].status).toBe("success");
    });
  });
});
