# Implementation Plan: Add Job Manager to Demo Harness

**Jira**: https://concord-consortium.atlassian.net/browse/QI-130
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **Ready for Implementation**

## Implementation Plan

### Add @concord-consortium/interactive-api-host dependency

**Summary**: Add the host package as a dependency of the helpers package. During development, `npm link` connects the locally-built package from the sibling lara repo.

**Files affected**:
- `packages/helpers/package.json` — add dependency

**Estimated diff size**: ~2 lines

Add to `dependencies` in `packages/helpers/package.json`:
```json
"@concord-consortium/interactive-api-host": "^0.10.0",
```

Then link the local build. **Note**: The lara-typescript code requires Node 16 to build, and `nvm use 16` must also be active when building/testing the helpers package so that the npm-linked package is resolved correctly:
```bash
nvm use 16
cd ../lara/lara-typescript && npm run build
cd dist/interactive-api-host && npm link
cd ../../../../question-interactives/packages/helpers && npm link @concord-consortium/interactive-api-host
```

All subsequent build and test commands for this spec should be run with `nvm use 16` active.

---

### Create mock job executor

**Summary**: Implement `MockJobExecutor` class that satisfies the `IJobExecutor` interface with in-memory job state, built-in "success" and "failure" tasks, configurable messages, and 2000ms delay simulation. This is a new file in the helpers utilities directory.

**Files affected**:
- `packages/helpers/src/utilities/mock-job-executor.ts` — new file

**Estimated diff size**: ~120 lines

```typescript
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
      const job: IJobInfo = {
        version: 1,
        id,
        status: "failure",
        request,
        result: { message: `Unknown task: ${request.task}` },
        createdAt: now,
        completedAt: now,
      };
      this.jobs.push(job);
      return Promise.resolve(job);
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
```

Key design decisions:
- `nextJobId` is module-scoped — unique across all executor instances within a page load
- Plain `setTimeout`/`clearTimeout` with `ReturnType<typeof setTimeout>` for handle type — avoids `window` reference issues in Jest/Node test environments
- `pendingTimeouts` maps job ID → array of timeout handles for cleanup on cancel
- Custom `processingMessage` and `message` from the request override defaults via nullish coalescing (`??`)
- `getJobs` returns a shallow copy to prevent external mutation
- `updateJob` replaces the job in the array and notifies via callback

---

### Create module-level JobManager singleton

**Summary**: Create a singleton module that instantiates the `MockJobExecutor` and `JobManager`, exporting the `JobManager` instance for use by `IframeRuntime`. The singleton resets naturally on page reload.

**Files affected**:
- `packages/helpers/src/utilities/demo-job-manager.ts` — new file

**Estimated diff size**: ~10 lines

```typescript
import { JobManager } from "@concord-consortium/interactive-api-host";
import { MockJobExecutor } from "./mock-job-executor";

const mockExecutor = new MockJobExecutor();
export const demoJobManager = new JobManager(mockExecutor);
```

Pattern follows `demo.tsx` line 26: `const dynamicTextProxy = useDynamicTextProxy();` — module-level singleton created once on import.

---

### Integrate JobManager with IframeRuntime

**Summary**: Add `JobManager.addInteractive()` and `removeInteractive()` calls to `IframeRuntime`'s existing `useEffect`, alongside the other message listener registrations. The singleton is imported from the new module.

**Files affected**:
- `packages/helpers/src/components/iframe-runtime.tsx` — add import, add/remove interactive calls

**Estimated diff size**: ~10 lines

Add import at top of file:
```typescript
import { demoJobManager } from "../utilities/demo-job-manager";
```

Inside the `useEffect`, after the `phone.post("initInteractive", initInteractiveMessage);` call (line 195), add:

```typescript
      // Register interactive with the job manager for job system support
      const interactiveId = id || "demo-interactive";
      demoJobManager.addInteractive(interactiveId, phone);
```

In the cleanup function (after `phoneRef.current.disconnect();` on line 207), add:

```typescript
        const interactiveId = id || "demo-interactive";
        demoJobManager.removeInteractive(interactiveId);
```

The full cleanup block becomes:
```typescript
    return () => {
      if (phoneRef.current) {
        const interactiveId = id || "demo-interactive";
        demoJobManager.removeInteractive(interactiveId);
        phoneRef.current.disconnect();
      }
    };
```

Note: `addInteractive` is called after `initInteractive` sends the init message. The `JobManager` registers its own `createJob`/`cancelJob` listeners on the phone — this doesn't conflict with other listeners since iframe-phone supports multiple listeners per message type. `removeInteractive` is called before `disconnect()` so the JobManager cleans up its routing mappings while the phone reference is still valid.

---

### Add unit tests for MockJobExecutor

**Summary**: Add comprehensive unit tests for the mock executor covering all requirement scenarios. Uses Jest fake timers to control `setTimeout` behavior.

**Files affected**:
- `packages/helpers/src/utilities/mock-job-executor.test.ts` — new file

**Estimated diff size**: ~200 lines

```typescript
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
```

Test pattern follows existing helpers tests (e.g., `css-url-value.test.ts`): co-located `.test.ts` files with `describe`/`it` blocks.

---

## Open Questions

<!-- Implementation-focused questions only. Requirements questions go in requirements.md. -->

