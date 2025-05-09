import React from "react";
import { act, render } from "@testing-library/react";
import { useInitMessage, useReportItem, useAutoSetHeight } from "@concord-consortium/lara-interactive-api";
import { AppComponent } from "./app";
import { IAuthoredState, IInteractiveState } from "../types";
import { reportItemHandler } from "./report-item";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAutoSetHeight: jest.fn(),
  useReportItem: jest.fn()
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAutoSetHeightMock = useAutoSetHeight as jest.Mock;
const useReportItemMock = useReportItem as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
} as IAuthoredState;

const interactiveState = {
  answerType: "interactive_state",
  answerText: "Test answer",
} as IInteractiveState;

describe.only("Drawing Tool question report item", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a 'Loading...' message if initMessage is not yet defined", async () => {
    useInitMessageMock.mockReturnValue(undefined);
    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    await act(async () => {
      expect(container.innerHTML).toEqual(expect.stringContaining("Loading..."));
    });
  });

  it("renders an error message if mode is not reportItem", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "authoring",
      authoredState
    });

    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    await act(async () => {
      expect(container.innerHTML).toContain("This interactive is only available in 'reportItem' mode but 'authoring' was given.");
    });
  });

  it("calls useReportItem with correct arguments", () => {
    render(<AppComponent />);
    expect(useReportItemMock).toHaveBeenCalledWith({
      metadata: {
        compactAnswerReportItemsAvailable: true
      },
      handler: reportItemHandler
    });
  });

  it("calls useAutoSetHeight", () => {
    render(<AppComponent />);
    expect(useAutoSetHeightMock).toHaveBeenCalled();
  });

  it("renders nothing if initMessage is set and mode is reportItem", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "reportItem",
      authoredState,
      interactiveState
    });

    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    await act(async () => {
      expect(container.innerHTML).toEqual("");
    });
  });

  it("renders nothing if initMessage is set with reportItem mode but no interactiveState", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "reportItem",
      authoredState
    });

    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    await act(async () => {
      expect(container.innerHTML).toEqual("");
    });
  });
});
