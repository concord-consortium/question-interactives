import { RefObject, useRef } from "react";
import Form from "@rjsf/core";

interface IConfig {
  formRef: RefObject<Form<any>>;
  delay?: number; // ms
}

const defaultDelay = 500; // ms

// Note that this will actually trigger submit(), as that's the way to trigger validation.
// Our form don't have submit buttons and don't set onSubmit handlers, so it should be fine.
export const useDelayedValidation = (config: IConfig) => {
  const timer = useRef<number>();

  return () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => config.formRef.current?.submit(), config.delay || defaultDelay);
  };
};
