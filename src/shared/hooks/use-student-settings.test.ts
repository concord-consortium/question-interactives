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
  it("returns student settings from Firestore", async () => {
    const HookWrapper = () => {
      return useStudentSettings();
    }

    const { result, waitForNextUpdate } = renderHook(HookWrapper);
    await waitForNextUpdate();

    expect(watchStudentSettingsMock).toHaveBeenCalled();
    expect(getStudentInfoAndSignInToFirestoreMock).toHaveBeenCalled();
    expect(result.current).toEqual({
      scaffoldedQuestionLevel: 3
    });
  });
});
