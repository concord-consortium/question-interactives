import { getReportItemHtml } from "./get-report-item-html";
import { IAuthoredState, IInteractiveState } from "../types";

describe("getReportItemHtml", () => {
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

  it("returns empty string when there is no drawingState", () => {
    const stateWithoutDrawing = { ...interactiveState, drawingState: undefined };
    const result = getReportItemHtml({ interactiveState: stateWithoutDrawing, authoredState });
    expect(result).toBe("");
  });

  it("returns the correct HTML structure with both tall and wide views", () => {
    const result = getReportItemHtml({ interactiveState, authoredState });
    expect(result).toContain("<style>");
    expect(result).toContain("</style>");
    expect(result).toContain(".tall {");
    expect(result).toContain(".wide {");
    expect(result).toContain('<div class="tall">');
    expect(result).toContain('<div class="wide">');
  });

  it("includes the StaticDrawing component in both views", () => {
    const result = getReportItemHtml({ interactiveState, authoredState });
    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
    expect(result).toContain('viewBox="0 0 600 600"');
    expect(result).toContain("background:#ffffff");
  });
});
