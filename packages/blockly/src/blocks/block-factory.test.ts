import { Blocks, FieldDropdown, FieldNumber } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { registerCustomBlocks } from "./block-factory";
import { ICustomBlock } from "../components/types";

// Mock Blockly and its components
jest.mock("blockly/core", () => ({
  Blocks: {},
  FieldDropdown: jest.fn().mockImplementation((options) => ({
    setValue: jest.fn(),
    getValue: jest.fn().mockReturnValue("test_value"),
    options
  })),
  FieldNumber: jest.fn().mockImplementation((defaultValue) => ({
    setValue: jest.fn(),
    getValue: jest.fn().mockReturnValue(defaultValue || 1),
    defaultValue
  })),
  FieldImage: jest.fn().mockImplementation((src, width, height, alt) => ({
    setValue: jest.fn(),
    setOnClickHandler: jest.fn(),
    src,
    width,
    height,
    alt
  }))
}));

jest.mock("@blockly/field-slider", () => ({
  FieldSlider: jest.fn().mockImplementation((defaultValue, min, max) => ({
    setValue: jest.fn(),
    getValue: jest.fn().mockReturnValue(defaultValue),
    defaultValue,
    min,
    max
  }))
}));

jest.mock("blockly/javascript", () => ({
  javascriptGenerator: {
    forBlock: {},
    statementToCode: jest.fn().mockReturnValue("// statement code"),
    valueToCode: jest.fn().mockReturnValue("test_value"),
    ORDER_NONE: 0
  }
}));

describe("block-factory", () => {
  let mockBlock: any;
  let mockInput: any;
  let mockStatementsInput: any;
  let mockWorkspace: any;
  let spy: jest.SpiedFunction<typeof javascriptGenerator.statementToCode>;

  beforeEach(() => {
    if (spy) spy.mockRestore();
    jest.clearAllMocks();
    (Blocks as any) = {};
    (javascriptGenerator.forBlock as any) = {};

    mockInput = {
      appendField: jest.fn().mockReturnThis(),
      insertFieldAt: jest.fn().mockReturnThis(),
      setCheck: jest.fn().mockReturnThis()
    };

    mockStatementsInput = {
      setCheck: jest.fn(),
      setVisible: jest.fn(),
      connection: {
        targetBlock: jest.fn().mockReturnValue(null),
        connect: jest.fn()
      }
    };

    mockWorkspace = {
      newBlock: jest.fn().mockReturnValue({
        initSvg: jest.fn(),
        render: jest.fn(),
        previousConnection: {},
        nextConnection: {}
      })
    };

    mockBlock = {
      appendDummyInput: jest.fn().mockReturnValue(mockInput),
      appendStatementInput: jest.fn().mockReturnValue(mockStatementsInput),
      appendValueInput: jest.fn().mockReturnValue(mockInput),
      appendField: jest.fn().mockReturnThis(),
      setPreviousStatement: jest.fn(),
      setNextStatement: jest.fn(),
      setInputsInline: jest.fn(),
      setColour: jest.fn(),
      setOnChange: jest.fn(),
      setOutput: jest.fn(),
      getInput: jest.fn().mockReturnValue(mockStatementsInput),
      getInputTargetBlock: jest.fn().mockReturnValue(mockStatementsInput),
      getField: jest.fn(),
      getFieldValue: jest.fn(),
      render: jest.fn(),
      workspace: mockWorkspace,
      isInFlyout: false
    };

    spy = jest
      .spyOn(javascriptGenerator, "statementToCode")
      .mockImplementation((_block, _name) => "");
  });

  describe("registerCustomBlocks", () => {
    it("handles non-array input gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      registerCustomBlocks(null as any);
      registerCustomBlocks("not an array" as any);
      registerCustomBlocks(undefined as any);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        "registerCustomBlocks: customBlocks is not an array:",
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it("registers setter blocks correctly", () => {
      const setterBlock: ICustomBlock = {
        id: "custom_set_color_123",
        type: "setter",
        name: "color",
        color: "#FF0000",
        category: "Properties",
        config: {
          canHaveChildren: false,
          typeOptions: [["red", "RED"], ["blue", "BLUE"]]
        }
      };

      registerCustomBlocks([setterBlock]);

      expect(Blocks["custom_set_color_123"]).toBeDefined();
      expect(javascriptGenerator.forBlock["custom_set_color_123"]).toBeDefined();
    });

    it("registers creator blocks correctly", () => {
      const creatorBlock: ICustomBlock = {
        id: "custom_create_molecules_456",
        type: "creator",
        name: "molecules",
        color: "#00FF00",
        category: "General",
        config: {
          canHaveChildren: true,
          childBlocks: [{ blockId: "custom_set_color_123" }],
          defaultCount: 100,
          minCount: 0,
          maxCount: 500,
          typeOptions: [["water", "WATER"], ["air", "AIR"]]
        }
      };

      registerCustomBlocks([creatorBlock]);

      expect(Blocks["custom_create_molecules_456"]).toBeDefined();
      expect(javascriptGenerator.forBlock["custom_create_molecules_456"]).toBeDefined();
    });

    it("registers multiple blocks", () => {
      const blocks: ICustomBlock[] = [
        {
          id: "block1",
          type: "setter",
          name: "speed",
          color: "#FF0000",
          category: "Properties",
          config: {
            canHaveChildren: false,
            includeNumberInput: true
          }
        },
        {
          id: "block2",
          type: "creator",
          name: "particles",
          color: "#00FF00",
          category: "General",
          config: { canHaveChildren: true }
        }
      ];

      registerCustomBlocks(blocks);

      expect(Blocks["block1"]).toBeDefined();
      expect(Blocks["block2"]).toBeDefined();
      expect(javascriptGenerator.forBlock["block1"]).toBeDefined();
      expect(javascriptGenerator.forBlock["block2"]).toBeDefined();
    });
  });

  describe("Setter Block Initialization", () => {
    let setterBlock: ICustomBlock;

    beforeEach(() => {
      setterBlock = {
        id: "custom_set_color_123",
        type: "setter",
        name: "color",
        color: "#FF0000",
        category: "Properties",
        config: {
          canHaveChildren: false,
          typeOptions: [["red", "RED"], ["blue", "BLUE"]]
        }
      };

      registerCustomBlocks([setterBlock]);
    });

    it("initializes setter block with correct display name", () => {
      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(mockBlock.appendDummyInput).toHaveBeenCalled();
      expect(mockInput.appendField).toHaveBeenCalledWith("set color");
    });

    it("adds dropdown field when typeOptions are provided", () => {
      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(FieldDropdown).toHaveBeenCalledWith([["red", "RED"], ["blue", "BLUE"]]);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "value");
    });

    it("adds number input when includeNumberInput is true", () => {
      setterBlock.config = {
        canHaveChildren: false,
        includeNumberInput: true
      };
      registerCustomBlocks([setterBlock]);

      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(FieldNumber).toHaveBeenCalledWith(0);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "value");
    });

    it("sets block color and connections", () => {
      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(mockBlock.setColour).toHaveBeenCalledWith("#FF0000");
      expect(mockBlock.setPreviousStatement).toHaveBeenCalledWith(true);
      expect(mockBlock.setNextStatement).toHaveBeenCalledWith(true);
    });

    it("adds fields in correct order for setter blocks with dropdown", () => {
      Blocks["custom_set_color_123"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be "set color"
      expect(appendFieldCalls[0][0]).toBe("set color");
      // Second call should be the dropdown
      expect(appendFieldCalls[1][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(appendFieldCalls[1][1]).toBe("value");
    });

    it("adds fields in correct order for setter blocks with number input", () => {
      const setterBlockWithNumberInput: ICustomBlock = {
        id: "custom_set_speed_789",
        type: "setter",
        name: "speed",
        color: "#FF0000",
        category: "Properties",
        config: {
          canHaveChildren: false,
          includeNumberInput: true
        }
      };

      registerCustomBlocks([setterBlockWithNumberInput]);
      Blocks["custom_set_speed_789"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be "set speed"
      expect(appendFieldCalls[0][0]).toBe("set speed");
      // Second call should be the number field
      expect(appendFieldCalls[1][0]).toEqual(expect.any(Object)); // FieldNumber
      expect(appendFieldCalls[1][1]).toBe("value");
    });
  });

  describe("Creator Block Initialization", () => {
    let creatorBlock: ICustomBlock;

    beforeEach(() => {
      creatorBlock = {
        id: "custom_create_molecules_456",
        type: "creator",
        name: "molecules",
        color: "#00FF00",
        category: "General",
        config: {
          canHaveChildren: true,
          childBlocks: [{ blockId: "custom_set_color_123" }],
          defaultCount: 100,
          minCount: 0,
          maxCount: 500,
          typeOptions: [["water", "WATER"], ["air", "AIR"]]
        }
      };

      registerCustomBlocks([creatorBlock]);
    });

    it("initializes creator block with correct display name", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);

      expect(mockBlock.appendDummyInput).toHaveBeenCalled();
      expect(mockInput.appendField).toHaveBeenCalledWith("create");
      expect(mockInput.appendField).toHaveBeenCalledWith("molecules");
    });

    it("starts closed with no statement input (input is added when opened)", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);

      expect(mockBlock.appendStatementInput).not.toHaveBeenCalled();
      expect(mockBlock.__disclosureOpen).toBe(false);
      expect(mockBlock.__savedChildrenXml).toBe("");
    });

    it("adds toggle icon and initializes as closed", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);

      expect(mockInput.insertFieldAt).toHaveBeenCalledWith(0, expect.any(Object), "__disclosure_icon");
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "count");
    });

    it("adds fields in correct order for creator blocks", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be "create"
      expect(appendFieldCalls[0][0]).toBe("create");
      // Second call should be the count slider
      expect(appendFieldCalls[1][0]).toEqual(expect.objectContaining({
        defaultValue: 100
      }));
      // Third call should be type dropdown
      expect(appendFieldCalls[2][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(appendFieldCalls[2][1]).toBe("type");
      // Fourth call should be "molecules" (the name)
      expect(appendFieldCalls[3][0]).toBe("molecules");
    });
  });

  describe("Action Block Initialization", () => {
    let actionBlock: ICustomBlock;

    beforeEach(() => {
      actionBlock = {
        category: "Actions",
        color: "#004696",
        config: {
          canHaveChildren: true,
          childBlocks: [{ blockId: "custom_set_color_123" }],
          generatorTemplate: "${ACTION} ${DIRECTION}",
          parameters: [
            {
              kind: "select",
              labelPosition: "prefix",
              labelText: "Move",
              name: "DIRECTION",
              options: [{ label: "forward", value: "FORWARD" }, { label: "backward", value: "BACKWARD" }]
            },
            {
              defaultValue: 1,
              kind: "number",
              labelPosition: "suffix",
              labelText: "at speed",
              name: "SPEED"
            }
          ]
        },
        id: "custom_action_move_789",
        name: "move",
        type: "action"
      };

      registerCustomBlocks([actionBlock]);
    });

    it("initializes action block with correct display name", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(mockBlock.appendDummyInput).toHaveBeenCalled();
      expect(mockInput.appendField).toHaveBeenCalledWith("Move");
    });

    it("adds select parameter fields", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(FieldDropdown).toHaveBeenCalledWith(
        [["forward", "FORWARD"], ["backward", "BACKWARD"]]
      );
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "DIRECTION");
    });

    it("adds number parameter fields", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(FieldNumber).toHaveBeenCalledWith(1);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "SPEED");
    });

    it("starts closed with no statement input when `canHaveChildren` is true (input is added when opened)", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);
      expect(mockBlock.appendStatementInput).not.toHaveBeenCalled();
      expect(mockBlock.__disclosureOpen).toBe(false);
      expect(mockBlock.__savedChildrenXml).toBe("");
    });

    it("adds fields in correct order for action blocks", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be the block display name "move"
      expect(appendFieldCalls[0][0]).toBe("move");
      // Second call should be the prefix label "Move"
      expect(appendFieldCalls[1][0]).toBe("Move");
      // Third call should be the dropdown for DIRECTION
      expect(appendFieldCalls[2][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(appendFieldCalls[2][1]).toBe("DIRECTION");
      // Fourth call should be the number field for SPEED
      expect(appendFieldCalls[3][0]).toEqual(expect.any(Object)); // FieldNumber
      expect(appendFieldCalls[3][1]).toBe("SPEED");
      // Fifth call should be the suffix label "at speed"
      expect(appendFieldCalls[4][0]).toBe("at speed");
    });

    it("sets block color and connections", () => {
      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(mockBlock.setColour).toHaveBeenCalledWith("#004696");
      expect(mockBlock.setPreviousStatement).toHaveBeenCalledWith(true);
      expect(mockBlock.setNextStatement).toHaveBeenCalledWith(true);
    });

    it("handles action block without child blocks", () => {
      actionBlock.config.canHaveChildren = false;
      actionBlock.config.childBlocks = [];
      registerCustomBlocks([actionBlock]);

      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(mockBlock.appendStatementInput).not.toHaveBeenCalled();
    });

    it("handles action block without parameters", () => {
      (actionBlock.config as any).parameters = [];
      registerCustomBlocks([actionBlock]);

      Blocks["custom_action_move_789"].init.call(mockBlock);

      expect(FieldDropdown).not.toHaveBeenCalled();
      expect(FieldNumber).not.toHaveBeenCalled();
    });
  });

  describe("Ask Block Initialization", () => {
    let askBlock: ICustomBlock;

    beforeEach(() => {
      askBlock = {
        category: "Control",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          targetEntity: "molecules",
          options: [["water", "water"], ["ink", "ink"]]
        },
        id: "custom_statement_ask_123",
        name: "ask",
        type: "ask"
      };

      registerCustomBlocks([askBlock]);
    });

    it("initializes ask block with correct display name", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);

      expect(mockBlock.appendDummyInput).toHaveBeenCalled();
      expect(mockInput.appendField).toHaveBeenCalledWith("ask");
    });

    it("adds target dropdown field", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);

      expect(FieldDropdown).toHaveBeenCalledWith([["water", "water"], ["ink", "ink"]]);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "target");
    });

    it("adds target entity label", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);

      expect(mockInput.appendField).toHaveBeenCalledWith("molecules");
    });

    it("adds statement input for nested blocks", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);

      expect(mockBlock.appendStatementInput).toHaveBeenCalledWith("statements");
    });

    it("sets block color and connections", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);

      expect(mockBlock.setColour).toHaveBeenCalledWith("#0089b8");
      expect(mockBlock.setPreviousStatement).toHaveBeenCalledWith(true);
      expect(mockBlock.setNextStatement).toHaveBeenCalledWith(true);
    });

    it("adds fields in correct order", () => {
      Blocks["custom_statement_ask_123"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be "ask"
      expect(appendFieldCalls[0][0]).toBe("ask");
      // Second call should be the target dropdown
      expect(appendFieldCalls[1][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(appendFieldCalls[1][1]).toBe("target");
      // Third call should be the target entity label
      expect(appendFieldCalls[2][0]).toBe("molecules");
    });
  });

  describe("Condition Block Initialization", () => {
    // Helper function to set up multi-input mock for suffix label position tests
    const setupMultiInputMock = () => {
      const mockFirstInput = { appendField: jest.fn().mockReturnThis() };
      const mockSecondInput = { appendField: jest.fn().mockReturnThis() };
      let callCount = 0;
      
      mockBlock.appendDummyInput = jest.fn(() => {
        callCount++;
        return callCount === 1 ? mockFirstInput : mockSecondInput;
      });
      
      return { mockFirstInput, mockSecondInput };
    };

    it("initializes condition block with prefix label position", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["touching", "touching?"], ["near", "near?"]],
          labelPosition: "prefix"
        },
        id: "custom_condition_touching_404",
        name: "touching",
        type: "condition"
      };

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_touching_404"].init.call(mockBlock);

      expect(mockBlock.setOutput).toHaveBeenCalledWith(true, "Boolean");
      expect(mockBlock.appendDummyInput).toHaveBeenCalled();
      expect(mockInput.appendField).toHaveBeenCalledWith("touching");
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "condition");
    });

    it("sets correct output type and color for condition blocks", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["touching", "touching?"], ["near", "near?"]],
          labelPosition: "prefix"
        },
        id: "custom_condition_touching_404",
        name: "touching",
        type: "condition"
      };

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_touching_404"].init.call(mockBlock);

      expect(mockBlock.setOutput).toHaveBeenCalledWith(true, "Boolean");
      expect(mockBlock.setColour).toHaveBeenCalledWith("#0089b8");
    });

    it("adds dropdown field with condition options", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["touching", "touching?"], ["near", "near?"]],
          labelPosition: "prefix"
        },
        id: "custom_condition_touching_404",
        name: "touching",
        type: "condition"
      };

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_touching_404"].init.call(mockBlock);

      expect(FieldDropdown).toHaveBeenCalledWith([["touching", "touching?"], ["near", "near?"]]);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "condition");
    });

    it("initializes condition block with suffix label position", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["is", "is"], ["equals", "="]],
          labelPosition: "suffix"
        },
        id: "custom_condition_is_505",
        name: "is",
        type: "condition"
      };

      const { mockSecondInput } = setupMultiInputMock();

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_is_505"].init.call(mockBlock);

      expect(mockBlock.setOutput).toHaveBeenCalledWith(true, "Boolean");
      expect(mockBlock.appendDummyInput).toHaveBeenCalledTimes(2); // One for dropdown, one for label
      expect(mockSecondInput.appendField).toHaveBeenCalledWith(expect.any(Object), "condition");
      expect(mockSecondInput.appendField).toHaveBeenCalledWith("is");
    });

    it("adds fields in correct order for condition blocks with prefix label position", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["touching", "touching?"], ["near", "near?"]],
          labelPosition: "prefix"
        },
        id: "custom_condition_touching_404",
        name: "touching",
        type: "condition"
      };

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_touching_404"].init.call(mockBlock);
      const appendFieldCalls = mockInput.appendField.mock.calls;
      
      // First call should be the display name "touching"
      expect(appendFieldCalls[0][0]).toBe("touching");
      // Second call should be the condition dropdown
      expect(appendFieldCalls[1][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(appendFieldCalls[1][1]).toBe("condition");
    });

    it("adds fields in correct order for condition blocks with suffix label position", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["is", "is"], ["equals", "="]],
          labelPosition: "suffix"
        },
        id: "custom_condition_is_505",
        name: "is",
        type: "condition"
      };

      const { mockSecondInput } = setupMultiInputMock();

      registerCustomBlocks([conditionBlock]);
      Blocks["custom_condition_is_505"].init.call(mockBlock);
      
      // Should have been called twice - once for main input, once for dropdown input
      expect(mockBlock.appendDummyInput).toHaveBeenCalledTimes(2);
      // The dropdown input should get the dropdown field and the label
      expect(mockSecondInput.appendField).toHaveBeenCalledWith(expect.any(Object), "condition");
      expect(mockSecondInput.appendField).toHaveBeenCalledWith("is");
    });
  });

  describe("Code Generation", () => {
    beforeEach(() => {
      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "DIRECTION": "FORWARD",
          "SPEED": 2,
          "value": "RED"
        };
        return values[fieldName] || "";
      });
    });

    it("generates code for setter block with options", () => {
      const setterBlock: ICustomBlock = {
        category: "Properties",
        color: "#ff0000",
        config: {
          canHaveChildren: false,
          typeOptions: [["red", "RED"], ["blue", "BLUE"]]
        },
        id: "custom_set_color_123",
        name: "color",
        type: "setter"
      };

      registerCustomBlocks([setterBlock]);

      mockBlock.getFieldValue = jest.fn().mockReturnValue("RED");
      const code = javascriptGenerator.forBlock["custom_set_color_123"].call(mockBlock, mockBlock);
      expect(code).toBe(`set_color(agent, "RED");\n`);
    });

    it("generates code for setter block with number input", () => {
      const setterBlock: ICustomBlock = {
        category: "Properties",
        color: "#ff0000",
        config: {
          canHaveChildren: false,
          includeNumberInput: true
        },
        id: "custom_set_speed_123",
        name: "speed",
        type: "setter"
      };

      registerCustomBlocks([setterBlock]);

      mockBlock.getFieldValue = jest.fn().mockReturnValue(5);

      const code = javascriptGenerator.forBlock["custom_set_speed_123"].call(mockBlock, mockBlock);
      expect(code).toBe(`set_speed(agent, "5");\n`);
    });

    it("generates code for creator block", () => {
      const creatorBlock: ICustomBlock = {
        category: "General",
        color: "#00ff00",
        config: {
          canHaveChildren: true,
          defaultCount: 100,
          typeOptions: [["water", "WATER"], ["air", "AIR"]]
        },
        id: "custom_create_molecules_456",
        name: "molecules",
        type: "creator"
      };

      registerCustomBlocks([creatorBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: Record<string, any> = {
          "type": "WATER",
          "count": 50
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_create_molecules_456"].call(mockBlock, mockBlock);
      expect(code).toBe("create_water(50, );\n");
    });

    it("generates code for action block with generator template", () => {
      const actionBlock: ICustomBlock = {
        category: "Actions",
        color: "#004696",
        config: {
          canHaveChildren: false,
          generatorTemplate: "${ACTION} ${DIRECTION}\nset speed ${SPEED}",
          parameters: [
            {
              kind: "select",
              labelPosition: "prefix",
              name: "DIRECTION",
              options: [{ label: "forward", value: "FORWARD" }, { label: "backward", value: "BACKWARD" }]
            },
            { 
              kind: "number",
              labelPosition: "prefix",
              name: "SPEED"
            }
          ]
        },
        id: "custom_action_move_789",
        name: "move",
        type: "action"
      };

      registerCustomBlocks([actionBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "DIRECTION": "FORWARD",
          "SPEED": 2
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_action_move_789"].call(mockBlock, mockBlock);
      expect(code).toBe("move FORWARD\nset speed 2\n");
    });

    it("handles action block without generator template", () => {
      const actionBlock: ICustomBlock = {
        category: "Actions",
        color: "#004696",
        config: {
          canHaveChildren: false
        },
        id: "custom_action_move_789",
        name: "move",
        type: "action"
      };

      registerCustomBlocks([actionBlock]);

      const code = javascriptGenerator.forBlock["custom_action_move_789"].call(mockBlock, mockBlock);
      expect(code).toBe("move\n");
    });

    it("replaces ACTION placeholder with snake-cases name", () => {
      const actionBlock: ICustomBlock = {
        category: "Actions",
        color: "#004696",
        config: {
          canHaveChildren: false,
          generatorTemplate: "${ACTION} ${DIRECTION}",
          parameters: [
            {
              kind: "select",
              labelPosition: "prefix",
              name: "DIRECTION",
              options: [{ label: "forward", value: "FORWARD" }, { label: "backward", value: "BACKWARD" }]
            }
          ]
        },
        id: "custom_action_bounce_off_789",
        name: "bounce off",
        type: "action"
      };

      registerCustomBlocks([actionBlock]);

      mockBlock.getFieldValue = jest.fn().mockReturnValue("FORWARD");

      const code = javascriptGenerator.forBlock["custom_action_bounce_off_789"].call(mockBlock, mockBlock);
      expect(code).toBe("bounce_off FORWARD\n");
    });

    it("handles multiple parameter replacements", () => {
      const actionBlock: ICustomBlock = {
        category: "Actions",
        color: "#004696",
        config: {
          canHaveChildren: false,
          generatorTemplate: "${ACTION} ${DIRECTION} ${MAGNITUDE} ${SPEED}",
          parameters: [
        {
          kind: "select",
          labelPosition: "prefix",
          name: "DIRECTION",
          options: [{ label: "forward", value: "FORWARD" }, { label: "backward", value: "BACKWARD" }]
        },
        {
          kind: "number",
          labelPosition: "prefix",
          name: "MAGNITUDE"
        },
        {
          kind: "number",
          labelPosition: "prefix",
          name: "SPEED"
        }
          ]
        },
        id: "custom_action_move_789",
        name: "move",
        type: "action"
      };

      registerCustomBlocks([actionBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "DIRECTION": "FORWARD",
          "MAGNITUDE": 5,
          "SPEED": 2
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_action_move_789"].call(mockBlock, mockBlock);
      expect(code).toBe("move FORWARD 5 2\n");
    });

    it("generates code for 'ask' statement block", () => {
      const statementBlock: ICustomBlock = {
        category: "Control",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          targetEntity: "molecules",
          options: [["water", "water"], ["ink", "ink"]]
        },
        id: "custom_statement_ask_123",
        name: "ask",
        type: "ask"
      };

      registerCustomBlocks([statementBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "target": "water"
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_statement_ask_123"].call(mockBlock, mockBlock);
      // TODO: Fix mocking javascriptGenerator.statementToCode
      // expect(code).toBe('sim.withLabel("water").forEach(agent => {\n// statement code\n});\n');
      expect(code).toBe('sim.withLabel("water").forEach(agent => {\n\n});\n');
    });

    it("generates code for 'ask' statement block", () => {
      const statementBlock: ICustomBlock = {
        category: "Control",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          targetEntity: "molecules",
          options: [["water", "water"], ["ink", "ink"]]
        },
        id: "custom_statement_ask_123",
        name: "ask",
        type: "ask"
      };

      registerCustomBlocks([statementBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "target": "water"
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_statement_ask_123"].call(mockBlock, mockBlock);
      // TODO: Fix mocking javascriptGenerator.statementToCode
      // expect(code).toBe('sim.withLabel("water").forEach(agent => {\n// statement code\n});\n');
      expect(code).toBe('sim.withLabel("water").forEach(agent => {\n\n});\n');
    });

    it("generates code for condition block", () => {
      const conditionBlock: ICustomBlock = {
        category: "Logic",
        color: "#0089b8",
        config: {
          canHaveChildren: false,
          options: [["touching", "touching?"], ["near", "near?"]],
          labelPosition: "prefix"
        },
        id: "custom_condition_touching_404",
        name: "touching",
        type: "condition"
      };

      registerCustomBlocks([conditionBlock]);

      mockBlock.getFieldValue = jest.fn().mockImplementation((fieldName) => {
        const values: { [key: string]: any } = {
          "condition": "touching?"
        };
        return values[fieldName] || "";
      });

      const code = javascriptGenerator.forBlock["custom_condition_touching_404"].call(mockBlock, mockBlock);
      expect(code).toBe("touching?");
    });
  });
});
