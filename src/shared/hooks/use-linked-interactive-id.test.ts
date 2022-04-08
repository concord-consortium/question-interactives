import { useContextInitMessage } from "./use-context-init-message";
import { useLinkedInteractiveId } from "./use-linked-interactive-id";

jest.mock("./use-context-init-message", () => ({
  useContextInitMessage: jest.fn()
}));
const useContextInitMessageMock = useContextInitMessage as jest.Mock;

const initMessageWithSnapshotTarget = {
  mode: "runtime",
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ]
};

const initMessageWithoutSnapshotTarget = {
  mode: "runtime",
  linkedInteractives: []
};

describe("useLinkedInteractiveId", () => {
  beforeEach(() => {
    useContextInitMessageMock.mockClear();
  });
  it("should return the ID of an interactive that has a specified label", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithSnapshotTarget);
    const snapshotTargetId = useLinkedInteractiveId("snapshotTarget");
    expect(snapshotTargetId).toEqual("123-MwInteractive");
  });
  it("should return undefined when there is no interactive that has a specified label", () => {
    useContextInitMessageMock.mockReturnValue(initMessageWithoutSnapshotTarget);
    const snapshotTargetId = useLinkedInteractiveId("snapshotTarget");
    expect(snapshotTargetId).toEqual(undefined);
  });
});
