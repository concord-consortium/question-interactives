import { IReportItemAnswer, IReportItemAnswerItem, sendReportItemAnswer } from "@concord-consortium/lara-interactive-api";

import { 
  defaultAuthoredState,
  defaultInteractiveState,
  savedInteractiveState,
  validToolboxAuthoredState
} from "../__mocks__/fixures";
import { reportItemHandler } from "./report-item";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  sendReportItemAnswer: jest.fn()
}));

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
      authoredState: validToolboxAuthoredState,
      interactiveState: savedInteractiveState,
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

  it("returns an empty html value if there is no interactive state", () => {
    reportItemHandler({
      version: "2.1.0",
      platformUserId: "user1",
      authoredState: defaultAuthoredState,
      interactiveState: defaultInteractiveState,
      itemsType: "fullAnswer",
      requestId: 1
    });
    expect(sendReportItemAnswer).toHaveBeenCalledTimes(1);
    const response: IReportItemAnswer = (sendReportItemAnswer as jest.Mock).mock.calls[0][0];
    expect(response.items).toHaveLength(2);
    const htmlItem = response.items[1] as IReportItemAnswerItem & { html: string };
    expect(htmlItem.type).toBe("html");
    expect(htmlItem.html).toContain("");
  });
});
