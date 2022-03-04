import firebase from "firebase/compat/app";
import 'firebase/compat/auth';
import "firebase/compat/firestore";
import { getFirebaseJwt, IJwtResponse } from "@concord-consortium/lara-interactive-api";
import {
  getFirestore, watchStudentSettings, signInWithToken, settingsPath, getStudentInfoAndSignInToFirestore
} from "./use-student-settings-helpers";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getFirebaseJwt: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(jwtResponse), 1)))
}));

const jwtResponse: IJwtResponse = {
  token: "123.abc",
  claims: {
    domain: "test-portal.concord.org",
    claims: {
      class_hash: "class-id",
      platform_user_id: 123,
      offering_id: 1,
      platform_id: "test platform",
      user_id: "123",
      user_type: "learner"
    } as any
  } as any
};


const getFirebaseJwtMock = (getFirebaseJwt as jest.Mock);

describe("useStudentSettings and related Firestore helpers", () => {
  beforeEach(() => {
    jest.spyOn(firebase, "initializeApp").mockImplementation(jest.fn());
    const docResult = {
      set: jest.fn(),
      onSnapshot: jest.fn()
    };
    const docMock: jest.Mock = jest.fn(() => docResult);
    const collectionResult: any = {
      onSnapshot: jest.fn(),
      where: jest.fn(() => collectionResult),
      doc: docMock
    };
    const collectionMock: jest.Mock = jest.fn(() => collectionResult);
    const firestoreMock: any = {
      doc: docMock,
      collection: collectionMock
    };
    jest.spyOn(firebase, "firestore").mockImplementation(jest.fn(() => firestoreMock));
    const auth: any = {
      signInWithCustomToken: jest.fn(),
      signOut: jest.fn(() => new Promise<void>((resolve) => resolve()))
    };
    jest.spyOn(firebase, "auth").mockImplementation(() => auth);
  });

  beforeEach(() => {
    getFirebaseJwtMock.mockClear();
  });

  describe("getFirestore", () => {
    it("should call firebase.initializeApp once and return only one instance", () => {
      const f1 = getFirestore();
      const f2 = getFirestore();
      expect(firebase.initializeApp).toHaveBeenCalledTimes(1);
      expect(firebase.firestore).toHaveBeenCalledTimes(1);
      expect(f1).toEqual(f2);
    });
  });

  describe("signInWithToken", () => {
    it("should ensure firebase.initializeApp was called once and auth using token", async () => {
      await signInWithToken("token.123");
      expect(firebase.initializeApp).toHaveBeenCalledTimes(1);
      expect(firebase.firestore).toHaveBeenCalledTimes(1);
      expect(firebase.auth().signInWithCustomToken).toHaveBeenCalledWith("token.123");
    });
  });

  describe("settingsPath", () => {
    it("should return path for collection or single student", () => {
      const source = "test.portal";
      const contextId = "testClass";
      expect(settingsPath(source, contextId)).toEqual(`/sources/${source}/contextId/${contextId}/studentSettings`);
      const userId = "testUser123";
      expect(settingsPath(source, contextId, userId)).toEqual(
        `/sources/${source}/contextId/${contextId}/studentSettings/${userId}`
      );
    });
  });

  describe("watchStudentSettings", () => {
    it("should call collection.doc.onSnapshot", () => {
      watchStudentSettings({ source: "test.portal", contextId: "testClass", userId: "testStudent123"}, jest.fn());
      const firestore = getFirestore();
      expect(firestore.collection).toHaveBeenCalled();
      expect(firestore.collection("ignoredByMock").doc).toHaveBeenCalled();
      expect(firestore.collection("ignoredByMock").doc("ignoredByMock").onSnapshot).toHaveBeenCalled();
    });
  });

  describe("getStudentInfoAndSignInToFirestore", () => {
    it("calls getFirebaseJwt, uses token to sign in to Firestore, and caches student info", async () => {
      let result = await getStudentInfoAndSignInToFirestore();
      expect(result).toEqual({
        source: "test-portal.concord.org",
        contextId: "class-id",
        userId: "123"
      });
      // and second time..
      result = await getStudentInfoAndSignInToFirestore();
      expect(result).toEqual({
        source: "test-portal.concord.org",
        contextId: "class-id",
        userId: "123"
      });
      // result should be cached
      expect(getFirebaseJwtMock).toHaveBeenCalledTimes(1);

      expect(firebase.auth().signInWithCustomToken).toHaveBeenCalledWith("123.abc");
    });
  });
});
