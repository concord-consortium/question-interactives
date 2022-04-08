import { useLinkedInteractiveId } from "./use-linked-interactive-id";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn()
}));
const useInitMessageMock = useInitMessage as jest.Mock;

const initMessageWithSnapshotTarget = {
  mode: "runtime",
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ]
};

describe("useLinkedInteractiveId", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
  });
  it("should return the ID of an interactive that has a specified label", () => {
    useInitMessageMock.mockReturnValue(initMessageWithSnapshotTarget);
    const snapshotTargetId = useLinkedInteractiveId("snapshotTarget");
    expect(snapshotTargetId).toEqual("123-MwInteractive");
  });
});
