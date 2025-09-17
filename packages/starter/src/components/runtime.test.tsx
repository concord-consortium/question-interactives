import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { DemoAuthoredState } from "./types";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import { StarterComponent } from "./starter";

const useInitMessageMock = useInitMessage as jest.Mock;

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  log: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
}));

const initMessage = {
  mode: "runtime" as const,
};
useInitMessageMock.mockReturnValue(initMessage);

describe("Starter runtime", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
  });

  it("renders a starter component with the correct props", () => {
    const wrapper = mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={DemoAuthoredState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(wrapper.find(StarterComponent).length).toEqual(1);
  });
});
