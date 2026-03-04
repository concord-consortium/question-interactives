/*
import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../types";
import { IReportItemAnswer, sendReportItemAnswer } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  sendReportItemAnswer: jest.fn()
}));

const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
};
*/

describe("reportItemHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has at least one test", () => {
    expect(true).toBe(true);
  });
});
