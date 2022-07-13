import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../types";
import { IReportItemAnswer, IReportItemAnswerItemScore, sendReportItemAnswer } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  sendReportItemAnswer: jest.fn()
}));

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
  attempts: [
    { score: 3, answerText: "bar" }
  ]
} as IInteractiveState;

describe("reportItemHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when itemsType=fullAnswer", () => {
    it("returns answerText and html items", () => {
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
      expect(response.items.find(i => i.type === "html")).toBeDefined();
      expect(response.items.find(i => i.type === "score")).toBeUndefined();
    });
  });

  describe("when itemsType=compactAnswer", () => {
    it("returns score item", () => {
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

      expect(response.items.length).toEqual(1);

      const scoreItem = response.items.find(i => i.type === "score") as IReportItemAnswerItemScore;
      expect(scoreItem).toBeDefined();
      expect(response.items.find(i => i.type === "answerText")).toBeUndefined();
      expect(response.items.find(i => i.type === "html")).toBeUndefined();

      expect(scoreItem.score).toEqual(3);
      expect(scoreItem.maxScore).toEqual(4);
    });
  });
});
