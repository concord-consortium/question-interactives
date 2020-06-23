import { useEffect, useState } from "react";
import {
  getStudentInfoAndSignInToFirestore, watchStudentSettings, IStudentSettings
} from "./use-student-settings-helpers";

export const useStudentSettings = () => {
  const [ settings, setSettings ] = useState<IStudentSettings | null>(null);

  useEffect(() => {
    getStudentInfoAndSignInToFirestore().then(info => {
      if (info) {
        watchStudentSettings(info, (newSettings: IStudentSettings) => setSettings(newSettings));
      }
      // Nothing to do otherwise, user is not a student running activity from Portal.
    });
  }, []);

  return settings;
};
