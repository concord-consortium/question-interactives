import React from "react";
import { render } from "@testing-library/react";
import { ReportItemComponent } from "./report-item";
import { IReportItemInitInteractive, useReportItem } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "../types";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useReportItem: jest.fn(),
}));

const authoredState = {
  version: 1,
  questionType: "open_response",
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
} as IAuthoredState;

const interactiveState = {
  answerType: "open_response_answer",
  answerText: "Test answer",
  audioFile: "audio123.mp3"
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

describe("Open response question report item", () => {
  it("calls useReportItem", () => {
    const { container } = render(<ReportItemComponent initMessage={initMessage} />);
    expect(container).toBeDefined();
    expect(useReportItem).toHaveBeenCalled();
  });
});
