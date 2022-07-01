import React from "react";
import { act, render } from "@testing-library/react";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";
import { AppComponent } from "./app";
import { IAuthoredState, IInteractiveState } from "../types";

jest.mock("./report-item", () => ({
  ReportItemComponent: () => {
    return <div>MockReportItemComponent</div>;
  }
}));

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAutoSetHeight: jest.fn(),
}));

const useInitMessageMock = useInitMessage as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: "",
  scoreBotItemId: "foo",
  scoreMapping: ["0", "1", "2", "3", "4"]
} as IAuthoredState;

const interactiveState = {
  answerType: "interactive_state",
  answerText: "Test answer",
} as IInteractiveState;

describe("Open response question report item", () => {
  it("renders a 'Loading...' message if initMessage is not yet defined", async () => {
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
      expect(container.innerHTML).toEqual(expect.stringContaining("This interactive is only available in 'reportItem' mode but 'authoring' was given."));
    });
  });

  it("returns the report item component if initMessage is set and mode is reportItem", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "reportItem",
      authoredState,
      interactiveState
    });

    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    await act(async () => {
      expect(container.innerHTML).toEqual(expect.stringContaining("MockReportItemComponent"));
    });
  });
});
