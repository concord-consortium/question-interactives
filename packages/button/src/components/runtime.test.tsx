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

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  log: jest.fn(),
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("disables the button and shows error when no scriptUrl is configured", () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, scriptUrl: "" });
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("No script URL is configured");
  });

  it("shows default processing message then success message", async () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, scriptUrl: "https://example.com/success" });

    // Click the button
    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    // Should show default processing message and disable button
    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("Submitting your work\u2026");

    // Advance past the fake delay
    await act(async () => { jest.advanceTimersByTime(2500); });
    wrapper.update();

    // Should show success message and keep button disabled
    expect(wrapper.text()).toContain("Great! Your teacher will be notified");
    expect(wrapper.find("button").prop("disabled")).toBe(true);
  });

  it("shows default processing message then failure message with button re-enabled", async () => {
    const wrapper = mountRuntime({ ...DemoAuthoredState, scriptUrl: "https://example.com/failure" });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.find("button").prop("disabled")).toBe(true);
    expect(wrapper.text()).toContain("Checking your answers\u2026");

    await act(async () => { jest.advanceTimersByTime(2500); });
    wrapper.update();

    expect(wrapper.text()).toContain("Sorry, you haven't finished answering all the questions");
    expect(wrapper.find("button").prop("disabled")).toBe(false);
  });

  it("uses custom processing and result messages from URL query params", async () => {
    const wrapper = mountRuntime({
      ...DemoAuthoredState,
      scriptUrl: "https://example.com/success?processingMessage=Working...&message=Custom success!"
    });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.text()).toContain("Working...");

    await act(async () => { jest.advanceTimersByTime(2500); });
    wrapper.update();

    expect(wrapper.text()).toContain("Custom success!");
  });

  it("uses custom processing and result messages for failure URLs", async () => {
    const wrapper = mountRuntime({
      ...DemoAuthoredState,
      scriptUrl: "https://example.com/failure?processingMessage=Validating...&message=Please try again."
    });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    expect(wrapper.text()).toContain("Validating...");

    await act(async () => { jest.advanceTimersByTime(2500); });
    wrapper.update();

    expect(wrapper.text()).toContain("Please try again.");
    expect(wrapper.find("button").prop("disabled")).toBe(false);
  });

  it("shows failure message for unsupported script URLs", async () => {
    const wrapper = mountRuntime({
      ...DemoAuthoredState,
      scriptUrl: "https://some-other-site.com/script"
    });

    act(() => { wrapper.find("button").simulate("click"); });
    wrapper.update();

    // executeScript returns immediate failure for unsupported URLs
    await act(async () => { jest.advanceTimersByTime(0); });
    wrapper.update();

    expect(wrapper.text()).toContain("Unsupported script URL");
  });
});
