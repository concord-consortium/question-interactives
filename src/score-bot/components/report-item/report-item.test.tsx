import React from "react";
import { render } from "@testing-library/react";
import { ReportItemComponent } from "./report-item";
import { IReportItemInitInteractive, addGetReportItemAnswerListener,
         getClient, } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addGetReportItemAnswerListener: jest.fn(),
  getClient: jest.fn(() => {
    return {
      post: jest.fn()
    };
  }),
}));

const getClientMock = getClient as jest.Mock;
const addGetReportItemAnswerListenerMock = addGetReportItemAnswerListener as jest.Mock;

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Test prompt",
  hint: "hint",
  required: true,
  defaultAnswer: "",
  scoreBotItemId: "foo",
  scoreMapping: ["0", "1", "2", "3", "4"]
} as IAuthoredState;

const interactiveState = {
  answerType: "interactive_state",
  answerText: "Test answer",
} as IInteractiveState;

const initMessage = {
  version: 1,
  mode: "reportItem",
  authoredState,
  interactiveState,
  hostFeatures: {},
  interactiveItemId: "123",
  view: "singleAnswer",
  users: {2: { hasAnswer: true }},
} as IReportItemInitInteractive;

describe("ScoreBOT question report item", () => {
  it("calls addGetReportItemAnswerListener and getClient", () => {
    const { container } = render(<ReportItemComponent initMessage={initMessage} />);
    expect(container).toBeDefined();
    expect(addGetReportItemAnswerListenerMock).toHaveBeenCalled();
    expect(getClientMock).toHaveBeenCalled();
  });
});
