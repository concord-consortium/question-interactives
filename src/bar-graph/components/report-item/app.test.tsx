import React from "react";
import { act, render } from "@testing-library/react";
import { useInitMessage, useReportItem } from "@concord-consortium/lara-interactive-api";
import { AppComponent } from "./app";
import { IAuthoredState, IInteractiveState } from "../types";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useReportItem: jest.fn(),
}));

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAutoSetHeight: jest.fn(),
  useReportItem: jest.fn()
}));

const useInitMessageMock = useInitMessage as jest.Mock;

const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
};

describe("Bar graph question report item", () => {
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

  it("calls useReportItem", () => {
    const { container } = render(<AppComponent />);
    expect(container).toBeDefined();
    expect(useReportItem).toHaveBeenCalled();
  });

  it("doesn't render anything if initMessage is set and mode is reportItem", async () => {
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
});
