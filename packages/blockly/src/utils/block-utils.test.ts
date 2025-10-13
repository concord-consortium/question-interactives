import { BLOCKLY_BUILT_IN_BLOCKS } from "../blocks/blockly-built-in-registry";
import { CUSTOM_BUILT_IN_BLOCKS } from "../blocks/custom-built-in-blocks";
import { ICustomBlock } from "../components/types";
import { availableChildBlocks, validateBlocksJson } from "./block-utils";

describe("block-utils", () => {
  describe("availableChildBlocks", () => {
    it("should return custom built-in blocks and Blockly built-in blocks when no custom blocks provided", () => {
      const result = availableChildBlocks([]);
      expect(result).toEqual([
        ...CUSTOM_BUILT_IN_BLOCKS,
        ...BLOCKLY_BUILT_IN_BLOCKS
      ]);
    });

    it("should include custom blocks when provided", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color", config: { canHaveChildren: false } } as ICustomBlock,
        { id: "custom_action_test", type: "action", name: "test", config: { canHaveChildren: true } } as ICustomBlock,
        { id: "custom_create_test", type: "creator", name: "create test", config: { canHaveChildren: true } } as ICustomBlock
      ];
      
      const result = availableChildBlocks(customBlocks);

      expect(result).toHaveLength(9); // 1 creator + 1 setter + 1 action + 3 custom built-in + 3 Blockly built-in
    });

    it("should exclude the block currently being edited from results", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color", config: { canHaveChildren: false } } as ICustomBlock,
        { id: "custom_action_test", type: "action", name: "test", config: { canHaveChildren: true } } as ICustomBlock
      ];

      const result = availableChildBlocks(customBlocks, "custom_action_test");

      expect(result).toHaveLength(7); // 1 setter + 0 action + 3 custom built-in + 3 Blockly built-in
    });

    it("should categorize blocks by type correctly", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color", config: { canHaveChildren: false } } as ICustomBlock,
        { id: "custom_set_speed", type: "setter", name: "speed", config: { canHaveChildren: false } } as ICustomBlock,
        { id: "custom_action_move", type: "action", name: "move", config: { canHaveChildren: true } } as ICustomBlock,
        { id: "custom_action_turn", type: "action", name: "turn", config: { canHaveChildren: true } } as ICustomBlock,
        { id: "custom_create_particles", type: "creator", name: "particles", config: { canHaveChildren: true } } as ICustomBlock
      ];

      const result = availableChildBlocks(customBlocks);

      expect(result).toHaveLength(11); // 1 creator + 2 setter + 2 action + 3 custom built-in + 3 Blockly built-in
    });
  });

  describe("validateBlocksJson", () => {
    it("should validate valid blocks array", () => {
      const validBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "test1",
          name: "color",
          type: "setter"
        },
        {
          category: "Actions",
          color: "#00ff00",
          config: {},
          id: "test2",
          name: "move",
          type: "action"
        }
      ];

      const result = validateBlocksJson(validBlocks);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-array input", () => {
      const result = validateBlocksJson("not an array");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("JSON must be an array of blocks");
    });

    it("should reject null input", () => {
      const result = validateBlocksJson(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("JSON must be an array of blocks");
    });

    it("should reject undefined input", () => {
      const result = validateBlocksJson(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("JSON must be an array of blocks");
    });

    it("should reject non-object items", () => {
      const invalidBlocks = ["not an object"];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 is not an object");
    });

    it("should reject blocks missing required category field", () => {
      const invalidBlocks = [
        {
          id: "test1",
          type: "setter",
          name: "color",
          color: "#ff0000",
          config: {}
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 is missing required field: category");
    });

        it("should reject blocks missing required color field", () => {
      const invalidBlocks = [
        {
          id: "test1",
          type: "setter",
          name: "color",
          config: {},
          category: "Properties"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 is missing required field: color");
    });

        it("should reject blocks missing required config field", () => {
      const invalidBlocks = [
        {
          id: "test1",
          type: "setter",
          name: "color",
          color: "#ff0000",
          category: "Properties"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 is missing required field: config");
    });

    it("should reject blocks with invalid id", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "",
          name: "color",
          type: "setter"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid id");
    });

    it("should reject blocks with duplicate ids", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "duplicate",
          name: "color",
          type: "setter"
        },
        {
          category: "Actions",
          color: "#00ff00",
          config: {},
          id: "duplicate",
          name: "move",
          type: "action"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Duplicate id found: duplicate");
    });

    it("should reject blocks with invalid type", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "test1",
          name: "color",
          type: "invalid"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid type: invalid");
    });

    it("should reject blocks with invalid name", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "test1",
          name: "",
          type: "setter"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid name");
    });

    it("should reject blocks with invalid category", () => {
      const invalidBlocks = [
        {
          category: "",
          color: "#ff0000",
          config: {},
          id: "test1",
          name: "color",
          type: "setter"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid category");
    });

    it("should reject blocks with invalid color", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: 123,
          config: {},
          id: "test1",
          name: "color",
          type: "setter"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid color");
    });

    it("should reject blocks with invalid config", () => {
      const invalidBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: null,
          id: "test1",
          name: "color",
          type: "setter"
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 has invalid config");
    });

    it("should validate all supported block types", () => {
      const validBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: {},
          id: "setter1",
          name: "color",
          type: "setter"
        },
        {
          category: "General",
          color: "#00ff00",
          config: {},
          id: "creator1",
          name: "particles",
          type: "creator"
        },
        {
          category: "Actions",
          color: "#0000ff",
          config: {},
          id: "action1",
          name: "move",
          type: "action"
        }
      ];

      const result = validateBlocksJson(validBlocks);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle empty array", () => {
      const result = validateBlocksJson([]);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
