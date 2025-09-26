import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { DemoAuthoredState } from "./types";
import { customBlocksAuthoredState } from "./__mocks__/fixtures";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";
import { BlocklyComponent } from "./blockly";

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

describe("Blockly runtime", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
  });

  it("renders a blockly component with the correct props", () => {
    const wrapper = mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={DemoAuthoredState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(wrapper.find(BlocklyComponent).length).toEqual(1);
  });

  it("renders a blockly component with custom blocks", () => {
    const wrapper = mount(
      <InitMessageContext.Provider value={initMessage as any}>
        <DynamicTextTester>
          <Runtime authoredState={customBlocksAuthoredState} />
        </DynamicTextTester>
      </InitMessageContext.Provider>
    );
    expect(wrapper.find(BlocklyComponent).length).toEqual(1);
    
    const blocklyComponent = wrapper.find(BlocklyComponent);
    const expectedAuthoredState = {
      ...customBlocksAuthoredState,
      hint: ""
    };
    expect(blocklyComponent.prop("authoredState")).toEqual(expectedAuthoredState);
  });
});
