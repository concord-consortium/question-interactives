// TODO: Replace with proper typed import once @concord-consortium/interactive-api-host is published
// with JobManager. Currently using npm link to the local lara build.
import { JobManager } from "@concord-consortium/interactive-api-host";
import { MockJobExecutor } from "./mock-job-executor";

const mockExecutor = new MockJobExecutor();
export const demoJobManager = new JobManager(mockExecutor);
