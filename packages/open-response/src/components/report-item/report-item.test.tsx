import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../types";
import { IReportItemAnswer, sendReportItemAnswer } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  sendReportItemAnswer: jest.fn()
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

describe("reportItemHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when itemsType=fullAnswer", () => {
    it("returns answerText and attachment items", () => {
      reportItemHandler({
        version: "2.1.0",
        platformUserId: "user1",
        authoredState,
        interactiveState,
        itemsType: "fullAnswer",
        requestId: 1
      });

      expect(sendReportItemAnswer).toHaveBeenCalledTimes(1);
      const response: IReportItemAnswer = (sendReportItemAnswer as jest.Mock).mock.calls[0][0];

      expect(response.items.length).toEqual(2);
      expect(response.items.find(i => i.type === "answerText")).toBeDefined();
      expect(response.items.find(i => i.type === "attachment")).toBeDefined();
    });
  });

  describe("when itemsType=compactAnswer", () => {
    it("doesn't return any items", () => {
      reportItemHandler({
        version: "2.1.0",
        platformUserId: "user1",
        authoredState,
        interactiveState,
        itemsType: "compactAnswer",
        requestId: 1
      });

      expect(sendReportItemAnswer).toHaveBeenCalledTimes(1);
      const response: IReportItemAnswer = (sendReportItemAnswer as jest.Mock).mock.calls[0][0];

      expect(response.items.length).toEqual(0);
    });
  });
});
