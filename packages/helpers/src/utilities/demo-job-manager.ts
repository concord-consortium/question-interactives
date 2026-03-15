import { JobManager } from "@concord-consortium/interactive-api-host";
import { MockJobExecutor } from "./mock-job-executor";

const mockExecutor = new MockJobExecutor();
export const demoJobManager = new JobManager(mockExecutor);
