import {
  watchStudentSettings, getStudentInfoAndSignInToFirestore, IStudentSettings
} from "./use-student-settings-helpers";
import { useStudentSettings } from "./use-student-settings";
import { renderHook } from "@testing-library/react-hooks";

jest.mock("./use-student-settings-helpers", () => ({
  watchStudentSettings: jest.fn((info: any, onSnapshot: any) => onSnapshot(settings)),
  getStudentInfoAndSignInToFirestore: jest.fn(() => new Promise(resolve => resolve({
    source: "test-portal.concord.org",
    contextId: "class-id",
    userId: "123"
  })))
}));

const settings: IStudentSettings = {
  scaffoldedQuestionLevel: 3
};

const watchStudentSettingsMock = watchStudentSettings as jest.Mock;
const getStudentInfoAndSignInToFirestoreMock = getStudentInfoAndSignInToFirestore as jest.Mock;

describe("useStudentSettings", () => {
  beforeEach(() => {
    watchStudentSettingsMock.mockClear();
    getStudentInfoAndSignInToFirestoreMock.mockClear();
  });

  it("returns student settings from Firestore", async () => {
    const HookWrapper = () => {
      return useStudentSettings();
    }

    const { result, waitForNextUpdate } = renderHook(HookWrapper);
    await waitForNextUpdate();


    expect(getStudentInfoAndSignInToFirestoreMock).toHaveBeenCalled();

    expect(watchStudentSettingsMock).toHaveBeenCalled();
    // Check first argument of watchStudentSettingsMock call.
    expect(watchStudentSettingsMock.mock.calls[0][0]).toEqual({
      source: "test-portal.concord.org",
      contextId: "class-id",
      userId: "123"
    });

    expect(result.current).toEqual({
      scaffoldedQuestionLevel: 3
    });
  });
});
