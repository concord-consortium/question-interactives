import { BUILT_IN_BLOCKS } from "../blocks/built-in-blocks-registry";
import { ICustomBlock } from "../components/types";
import { actionBlockChildOptions, validateBlocksJson } from "./block-utils";

describe("block-utils", () => {
  describe("actionBlockChildOptions", () => {
    it("should return built-in blocks for action blocks", () => {
      const result = actionBlockChildOptions([]);
      
      expect(result.builtInBlocks).toEqual(BUILT_IN_BLOCKS);
      BUILT_IN_BLOCKS.forEach(block => {
        expect(result.allBlocks).toContain(block);
      });
    });

    it("should include custom blocks when provided", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color" } as ICustomBlock,
        { id: "custom_action_test", type: "action", name: "test" } as ICustomBlock
      ];
      
      const result = actionBlockChildOptions(customBlocks);
      
      expect(result.setterBlocks).toHaveLength(1);
      expect(result.actionBlocks).toHaveLength(1);
      expect(result.builtInBlocks).toEqual(BUILT_IN_BLOCKS);
      expect(result.allBlocks).toHaveLength(5); // 1 setter + 1 action + 3 built-in
    });

    it("should exclude editing block from results", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color" } as ICustomBlock,
        { id: "custom_action_test", type: "action", name: "test" } as ICustomBlock
      ];
      
      const result = actionBlockChildOptions(customBlocks, "custom_set_color");
      
      expect(result.setterBlocks).toHaveLength(0);
      expect(result.actionBlocks).toHaveLength(1);
      expect(result.allBlocks).toHaveLength(4); // 0 setter + 1 action + 3 built-in
    });

    it("should categorize blocks by type correctly", () => {
      const customBlocks = [
        { id: "custom_set_color", type: "setter", name: "color" } as ICustomBlock,
        { id: "custom_set_speed", type: "setter", name: "speed" } as ICustomBlock,
        { id: "custom_action_move", type: "action", name: "move" } as ICustomBlock,
        { id: "custom_action_turn", type: "action", name: "turn" } as ICustomBlock,
        { id: "custom_create_particles", type: "creator", name: "particles" } as ICustomBlock
      ];
      
      const result = actionBlockChildOptions(customBlocks);
      
      expect(result.setterBlocks).toHaveLength(2);
      expect(result.actionBlocks).toHaveLength(2);
      expect(result.builtInBlocks).toEqual(BUILT_IN_BLOCKS);
      expect(result.allBlocks).toHaveLength(7); // 2 setter + 2 action + 3 built-in
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

    it("should reject blocks missing required fields", () => {
      const invalidBlocks = [
        {
          id: "test1",
          type: "setter",
          name: "color"
          // missing color, category, config
        }
      ];
      const result = validateBlocksJson(invalidBlocks);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Item 1 is missing required field: color");
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
