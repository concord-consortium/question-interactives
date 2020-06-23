import * as firebase from "firebase";
import "firebase/firestore";
import { getFirebaseJwt, IJwtResponse } from "@concord-consortium/lara-interactive-api";

export interface IStudentSettings {
  scaffoldedQuestionLevel?: number;
}

export interface IStudentInfo {
  source: string;
  contextId: string;
  userId: string;
}

// this firebase app is used by Glossary Dashboard that is slowly evolving into UDL Dashboard.
export const FIREBASE_APP = "glossary-plugin";

let dbInstance: firebase.firestore.Firestore | null = null;
// This can be cached globally, as we're inside iframe and student data can't change.
let studentInfo: IStudentInfo | null = null;
let triedToGetStudentInfo = false;

export const getStudentInfoAndSignInToFirestore = async () => {
  if (!triedToGetStudentInfo) {
    try {
      const firebaseJwt: IJwtResponse = await getFirebaseJwt(FIREBASE_APP);
      await signInWithToken(firebaseJwt.token);
      let domain = firebaseJwt.claims.domain;
      if (!domain.startsWith("http")) {
        // Protocol will be removed anyway, but URL parser throws an error if protocol is missing.
        domain = "http://" + domain;
      }
      studentInfo = {
        source: (new URL(domain)).hostname,
        contextId: firebaseJwt.claims.claims.class_hash,
        userId: firebaseJwt.claims.claims.platform_user_id.toString()
      };
    } catch(e) {
      // getFirebaseJwt will throw an exception when run doesn't have remote endpoint, so when user
      // hasn't launched an activity from Portal. In this case just do nothing special.
    } finally {
      // If getFirebaseJWT fails once, it doesn't make sense to try again.
      triedToGetStudentInfo = true;
    }
  }
  return studentInfo;
}

export const getFirestore = () => {
  if (!dbInstance) {
    // Initialize Cloud Firestore through Firebase
    firebase.initializeApp({
      apiKey: "AIzaSyAOCFQiOechmScOoJtYLPSv1kqdsf9sr1Y",
      authDomain: "glossary-plugin.firebaseapp.com",
      databaseURL: "https://glossary-plugin.firebaseio.com",
      projectId: "glossary-plugin",
      storageBucket: "glossary-plugin.appspot.com",
      messagingSenderId: "137541784121",
      appId: "1:137541784121:web:f1881d868bfd3d647f73e8",
      measurementId: "G-RJYWLT2NE4"
    });
    dbInstance = firebase.firestore();
  }
  return dbInstance;
};

export const signInWithToken = async (rawFirestoreJWT: string) => {
  // Ensure firebase.initializeApp has been called.
  getFirestore();
  // It's actually useful to sign out first, as firebase seems to stay signed in between page reloads otherwise.
  await firebase.auth().signOut();
  await firebase.auth().signInWithCustomToken(rawFirestoreJWT);
};

export const settingsPath = (source: string, contextId: string, userId?: string) =>
  `/sources/${source}/contextId/${contextId}/studentSettings${userId ? `/${userId}` : ""}`;

export const watchStudentSettings = (
  { source, contextId, userId}: IStudentInfo,
  onSnapshot: (settings: IStudentSettings) => void
) => {
  const db = getFirestore();
  db.collection(settingsPath(source, contextId)).doc(userId)
    .onSnapshot(snapshot => {
      const data = snapshot.data();
      if (data) {
        onSnapshot(data as IStudentSettings);
      }
    }, (err: Error) => {
      // tslint:disable-next-line no-console
      console.error(err);
      throw err;
    });
};
