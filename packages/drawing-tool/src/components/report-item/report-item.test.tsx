import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../types";
import { IReportItemAnswer, sendReportItemAnswer, IReportItemAnswerItem } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  sendReportItemAnswer: jest.fn()
}));

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
  drawingState: JSON.stringify({
    dt: { width: 600, height: 600 },
    canvas: {
      objects: [],
      background: "#ffffff"
    }
  })
} as IInteractiveState;

describe("reportItemHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends links and html items for version 2.x", () => {
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

    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      type: "links",
      hideViewInline: true
    });
    const htmlItem = response.items[1] as IReportItemAnswerItem & { html: string };
    expect(htmlItem.type).toBe("html");
    expect(htmlItem.html).toContain('<div class="tall">');
    expect(htmlItem.html).toContain('<div class="wide">');
  });

  it("handles missing drawingState gracefully", () => {
    const stateWithoutDrawing = { ...interactiveState, drawingState: undefined };
    
    reportItemHandler({
      version: "2.1.0",
      platformUserId: "user1",
      authoredState,
      interactiveState: stateWithoutDrawing,
      itemsType: "fullAnswer",
      requestId: 1
    });

    expect(sendReportItemAnswer).toHaveBeenCalledTimes(1);
    const response: IReportItemAnswer = (sendReportItemAnswer as jest.Mock).mock.calls[0][0];
    const htmlItem = response.items[1] as IReportItemAnswerItem & { html: string };
    expect(htmlItem.html).toBe("");
  });
});
