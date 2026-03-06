import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { DemoAuthoredState } from "./types";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";
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

describe("Button runtime", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
    mockCreateJob.mockClear();
    mockCreateJob.mockResolvedValue({});
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

  it("re-enables button and shows no message on cancelled job", () => {
    mockLatestJob = {
      status: "cancelled",
    };
    const wrapper = mountRuntime();

    expect(wrapper.find("button").prop("disabled")).toBe(false);
    expect(wrapper.text()).not.toContain("No task is configured");
  });
});
