import { 
  defaultAuthoredState,
  defaultInteractiveState,
  savedInteractiveState,
  validToolboxAuthoredState
} from "../__mocks__/fixures";
import { getReportItemHtml } from "./get-report-item-html";

describe("getReportItemHtml", () => {
  it("returns an empty string if there is no blockly state", () => {
    const result = getReportItemHtml({
      authoredState: defaultAuthoredState,
      interactiveState: defaultInteractiveState
    });
    expect(result).toBe("");
  });

  it("returns HTML for a valid blockly state", () => {
    const result = getReportItemHtml({
      authoredState: validToolboxAuthoredState,
      interactiveState: savedInteractiveState
    });
    expect(result).toContain('<div class="tall">');
    expect(result).toContain('<div class="wide">');
  });
});
