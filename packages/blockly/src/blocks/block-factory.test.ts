import { Blocks, FieldDropdown, FieldNumber } from "blockly/core";
// import { FieldSlider } from "@blockly/field-slider";
import { registerCustomBlocks } from "./block-factory";
import { ICustomBlock } from "../components/types";
import { netlogoGenerator } from "../utils/netlogo-generator";

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

jest.mock("../utils/netlogo-generator", () => ({
  netlogoGenerator: {
    forBlock: {},
    statementToCode: jest.fn().mockReturnValue("// statement code")
  }
}));

describe("block-factory", () => {
  let mockBlock: any;
  let mockInput: any;
  let mockStatementsInput: any;
  let mockWorkspace: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (Blocks as any) = {};
    (netlogoGenerator.forBlock as any) = {};

    mockInput = {
      appendField: jest.fn().mockReturnThis(),
      insertFieldAt: jest.fn().mockReturnThis()
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
      setPreviousStatement: jest.fn(),
      setNextStatement: jest.fn(),
      setInputsInline: jest.fn(),
      setColour: jest.fn(),
      setOnChange: jest.fn(),
      getInput: jest.fn().mockReturnValue(mockStatementsInput),
      getField: jest.fn(),
      getFieldValue: jest.fn(),
      render: jest.fn(),
      workspace: mockWorkspace,
      isInFlyout: false
    };
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
          typeOptions: [["red", "RED"], ["blue", "BLUE"]],
          includeNumberInput: false
        }
      };

      registerCustomBlocks([setterBlock]);

      expect(Blocks["custom_set_color_123"]).toBeDefined();
      expect(netlogoGenerator.forBlock["custom_set_color_123"]).toBeDefined();
    });

    it("registers creator blocks correctly", () => {
      const creatorBlock: ICustomBlock = {
        id: "custom_create_molecules_456",
        type: "creator",
        name: "molecules",
        color: "#00FF00",
        category: "General",
        config: {
          childBlocks: ["custom_set_color_123"],
          defaultCount: 100,
          minCount: 0,
          maxCount: 500,
          typeOptions: [["water", "WATER"], ["air", "AIR"]]
        }
      };

      registerCustomBlocks([creatorBlock]);

      expect(Blocks["custom_create_molecules_456"]).toBeDefined();
      expect(netlogoGenerator.forBlock["custom_create_molecules_456"]).toBeDefined();
    });

    it("registers multiple blocks", () => {
      const blocks: ICustomBlock[] = [
        {
          id: "block1",
          type: "setter",
          name: "speed",
          color: "#FF0000",
          category: "Properties",
          config: { includeNumberInput: true }
        },
        {
          id: "block2",
          type: "creator",
          name: "particles",
          color: "#00FF00",
          category: "General",
          config: {}
        }
      ];

      registerCustomBlocks(blocks);

      expect(Blocks["block1"]).toBeDefined();
      expect(Blocks["block2"]).toBeDefined();
      expect(netlogoGenerator.forBlock["block1"]).toBeDefined();
      expect(netlogoGenerator.forBlock["block2"]).toBeDefined();
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
          typeOptions: [["red", "RED"], ["blue", "BLUE"]],
          includeNumberInput: false
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
      setterBlock.config = { includeNumberInput: true };
      registerCustomBlocks([setterBlock]);

      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(FieldNumber).toHaveBeenCalledWith(1);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "value");
    });

    it("sets block color and connections", () => {
      Blocks["custom_set_color_123"].init.call(mockBlock);

      expect(mockBlock.setColour).toHaveBeenCalledWith("#FF0000");
      expect(mockBlock.setPreviousStatement).toHaveBeenCalledWith(true);
      expect(mockBlock.setNextStatement).toHaveBeenCalledWith(true);
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
          childBlocks: ["custom_set_color_123"],
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

    it("adds statement input for child blocks", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);

      expect(mockBlock.appendStatementInput).toHaveBeenCalledWith("statements");
      expect(mockStatementsInput.setCheck).toHaveBeenCalledWith(["custom_set_color_123"]);
    });

    it("adds toggle icon and initializes as closed", () => {
      Blocks["custom_create_molecules_456"].init.call(mockBlock);

      expect(mockInput.insertFieldAt).toHaveBeenCalledWith(0, expect.any(Object), "__disclosure_icon");
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "count");
    });
  });
});
