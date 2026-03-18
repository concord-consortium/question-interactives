import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { DemoAuthoredState } from "./types";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { log, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import { ButtonComponent } from "./button";

const useInitMessageMock = useInitMessage as jest.Mock;

// Shared mock state for useJobs
let mockLatestJob: any = null;
const mockCreateJob = jest.fn();

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  log: jest.fn(),
  useJobs: () => ({
    createJob: mockCreateJob,
    latestJob: mockLatestJob,
  }),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
}));

const initMessage = {
  mode: "runtime" as const,
};
useInitMessageMock.mockReturnValue(initMessage);

const mountRuntime = (authoredState = DemoAuthoredState) => {
  return mount(
    <InitMessageContext.Provider value={initMessage as any}>
      <DynamicTextTester>
        <Runtime authoredState={authoredState} />
      </DynamicTextTester>
    </InitMessageContext.Provider>
  );
};

// Stateful wrapper to force re-renders from inside React's reconciliation.
// enzyme's setProps({}) doesn't reliably trigger child re-renders when no props change.
let triggerRerender: () => void = () => { /* noop until mounted */ };

const RerenderableRuntime: React.FC<{ authoredState: typeof DemoAuthoredState }> = ({ authoredState }) => {
  const [, setTick] = React.useState(0);
  triggerRerender = () => setTick(n => n + 1);
  return (
    <InitMessageContext.Provider value={initMessage as any}>
      <DynamicTextTester>
        <Runtime authoredState={authoredState} />
      </DynamicTextTester>
    </InitMessageContext.Provider>
  );
};

const mountRerenderableRuntime = (authoredState = DemoAuthoredState) => {
  return mount(<RerenderableRuntime authoredState={authoredState} />);
};

const mockLog = log as jest.Mock;

describe("Button runtime", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
    mockCreateJob.mockClear();
    mockCreateJob.mockResolvedValue({});
    mockLog.mockClear();
    mockLatestJob = null;
  });

  it("renders a button component with the correct props", () => {
    const wrapper = mountRuntime();
    expect(wrapper.find(ButtonComponent).length).toEqual(1);
  });

  it("renders the button with the authored label", () => {
    const wrapper = mountRuntime();
    expect(wrapper.find("button").text()).toEqual("I'm Done!");
  });

  it("renders the default label when buttonLabel is empty", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, buttonLabel: "" });
    expect(wrapper.find("button").text()).toEqual("Submit");
  });

  it("disables the button and shows error when no task is configured", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "" });
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("No task is configured");
  });

  it("disables the button and shows error when task is undefined", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: undefined });
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("No task is configured");
  });

  it("disables the button and shows error when task is whitespace-only", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "   " });
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("No task is configured");
  });

  it("calls createJob with the task on click", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });

    expect(mockCreateJob).toHaveBeenCalledWith({ task: "success" });
  });

  it("calls createJob with task and parsed taskParams", () => {
    const wrapper = mountRuntime({
      ...DemoAuthoredState,
      task: "success",
      taskParams: "key1=value1&key2=value2"
    });

    act(() => { wrapper.find("button").simulate("click"); });

    expect(mockCreateJob).toHaveBeenCalledWith({
      key1: "value1",
      key2: "value2",
      task: "success",
    });
  });

  it("ensures task is not overridden by taskParams", () => {
    const wrapper = mountRuntime({
      ...DemoAuthoredState,
      task: "success",
      taskParams: "task=override"
    });

    act(() => { wrapper.find("button").simulate("click"); });

    // task from authoredState should win over taskParams
    expect(mockCreateJob).toHaveBeenCalledWith({
      task: "success",
    });
  });

  it("shows processing message when job is queued", () => {
    mockLatestJob = {
      status: "queued",
      result: { processingMessage: "Submitting your work\u2026" },
    };
    const wrapper = mountRuntime();

    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("Submitting your work\u2026");
  });

  it("shows processing message when job is running", () => {
    mockLatestJob = {
      status: "running",
      result: { processingMessage: "Checking your answers\u2026" },
    };
    const wrapper = mountRuntime();

    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("Checking your answers\u2026");
  });

  it("shows default processing message when none provided", () => {
    mockLatestJob = {
      status: "running",
      result: {},
    };
    const wrapper = mountRuntime();

    expect(wrapper.text()).toContain("Please wait\u2026");
  });

  it("shows success message and keeps button disabled", () => {
    mockLatestJob = {
      status: "success",
      result: { message: "Great! Your teacher will be notified." },
    };
    const wrapper = mountRuntime();

    expect(wrapper.text()).toContain("Great! Your teacher will be notified.");
    expect(wrapper.find("button").prop("disabled")).toBe(true);
  });

  it("shows failure message and re-enables button", () => {
    mockLatestJob = {
      status: "failure",
      result: { message: "Sorry, please try again." },
    };
    const wrapper = mountRuntime();

    expect(wrapper.text()).toContain("Sorry, please try again.");
    expect(wrapper.find("button").prop("disabled")).toBe(false);
  });

  it("disables the button immediately on click before latestJob updates", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "success" });
    expect(wrapper.find("button").prop("disabled")).toBe(false);

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    // Button should be disabled via local clicked state even though latestJob is still null
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(mockCreateJob).toHaveBeenCalledTimes(1);
  });

  it("stays disabled when latestJob transitions to queued after click", () => {
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();
    expect(wrapper.find("button").prop("disabled")).toBe(true);

    // Simulate latestJob updating to queued (localStatus resets but latestJob keeps it disabled)
    mockLatestJob = { status: "queued" };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(wrapper.find("button").prop("disabled")).toBe(true);
  });

  it("re-enables button and shows no message on cancelled job", () => {
    mockLatestJob = {
      status: "cancelled",
    };
    const wrapper = mountRuntime();

    expect(wrapper.find("button").prop("disabled")).toBe(false);
    expect(wrapper.find("[role=\"status\"]").text()).toBe("");
  });

  it("shows immediate progress on click before latestJob arrives", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("Please wait\u2026");
  });

  it("transitions seamlessly from immediate progress to job-provided message", () => {
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();
    expect(wrapper.text()).toContain("Please wait\u2026");

    mockLatestJob = {
      status: "queued",
      id: "job-1",
      result: { processingMessage: "Submitting your work\u2026" },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(wrapper.text()).toContain("Submitting your work\u2026");
    expect(wrapper.find("button").prop("disabled")).toBe(true);
  });

  it("shows immediate progress on retry after failure", () => {
    mockLatestJob = {
      status: "failure",
      result: { message: "Sorry, please try again." },
    };
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });
    expect(wrapper.text()).toContain("Sorry, please try again.");
    expect(wrapper.find("button").prop("disabled")).toBe(false);

    // Click retry — should show immediate progress even though latestJob is still failure
    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.text()).toContain("Please wait\u2026");
    expect(wrapper.text()).not.toContain("Sorry, please try again.");
    expect(wrapper.find("button").prop("disabled")).toBe(true);
  });

  it("shows error message and re-enables button when createJob throws", async () => {
    mockCreateJob.mockRejectedValue(new Error("network failure"));
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value.catch(() => { /* expected rejection */ });
    wrapper.update();

    expect(wrapper.text()).toContain("Something went wrong. Please try again.");
    expect(wrapper.find("button").prop("disabled")).toBe(false);
  });

  it("clears error state on new click after createJob failure", async () => {
    mockCreateJob.mockRejectedValue(new Error("network failure"));
    const wrapper = mountRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value.catch(() => { /* expected rejection */ });
    wrapper.update();
    expect(wrapper.text()).toContain("Something went wrong");

    mockCreateJob.mockResolvedValue({ id: "job-1" });
    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.text()).toContain("Please wait\u2026");
    expect(wrapper.text()).not.toContain("Something went wrong");
  });

  it("logs 'job success' with correct payload", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();

    mockLatestJob = {
      status: "success",
      id: "job-1",
      result: { message: "Great! Your teacher will be notified." },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).toHaveBeenCalledWith("button interactive: job success", {
      jobId: "job-1",
      message: "Great! Your teacher will be notified.",
      buttonLabel: "I'm Done!",
      task: "success",
    });
  });

  it("logs 'job failure' with correct payload", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();

    mockLatestJob = {
      status: "failure",
      id: "job-1",
      result: { message: "Sorry, please try again." },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).toHaveBeenCalledWith("button interactive: job failure", {
      jobId: "job-1",
      message: "Sorry, please try again.",
      buttonLabel: "I'm Done!",
      task: "success",
    });
  });

  it("logs 'job cancelled' with correct payload", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();

    mockLatestJob = {
      status: "cancelled",
      id: "job-1",
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).toHaveBeenCalledWith("button interactive: job cancelled", {
      jobId: "job-1",
      buttonLabel: "I'm Done!",
      task: "success",
    });
  });

  it("does not log for queued/running statuses", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();
    mockLog.mockClear();

    mockLatestJob = { status: "queued", id: "job-1" };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job success", expect.anything());
    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job failure", expect.anything());
    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job cancelled", expect.anything());
  });

  it("does not duplicate log on re-render", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();
    mockLog.mockClear();

    mockLatestJob = {
      status: "success",
      id: "job-1",
      result: { message: "Done!" },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    // Force another re-render
    act(() => { triggerRerender(); });
    wrapper.update();

    const successCalls = mockLog.mock.calls.filter(
      (call: any[]) => call[0] === "button interactive: job success"
    );
    expect(successCalls).toHaveLength(1);
  });

  it("logs separately for retry attempts", async () => {
    mockCreateJob.mockResolvedValue({ id: "job-1" });
    const wrapper = mountRerenderableRuntime({ ...DemoAuthoredState, task: "success" });

    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();

    mockLatestJob = {
      status: "failure",
      id: "job-1",
      result: { message: "Failed" },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).toHaveBeenCalledWith("button interactive: job failure", expect.objectContaining({ jobId: "job-1" }));

    // Retry — click again (button re-enabled after failure)
    mockCreateJob.mockResolvedValue({ id: "job-2" });
    act(() => { wrapper.find("button").simulate("click"); });
    await mockCreateJob.mock.results[mockCreateJob.mock.results.length - 1]?.value;
    wrapper.update();

    mockLatestJob = {
      status: "success",
      id: "job-2",
      result: { message: "Done!" },
    };
    act(() => { triggerRerender(); });
    wrapper.update();

    expect(mockLog).toHaveBeenCalledWith("button interactive: job success", expect.objectContaining({ jobId: "job-2" }));
  });

  it("does not log existing job on page load", () => {
    mockLatestJob = {
      status: "success",
      id: "job-1",
      result: { message: "Done!" },
    };
    mountRuntime({ ...DemoAuthoredState, task: "success" });

    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job success", expect.anything());
    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job failure", expect.anything());
    expect(mockLog).not.toHaveBeenCalledWith("button interactive: job cancelled", expect.anything());
  });
});
