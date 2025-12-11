import { ALL_BUILT_IN_BLOCKS } from "../blocks/block-constants";
import { ICustomBlock } from "../components/types";
import { extractCategoriesFromToolbox, injectCustomBlocksIntoToolbox } from "./toolbox-utils";

describe("toolbox-utils", () => {
  describe("extractCategoriesFromToolbox", () => {
    it("should extract categories from valid toolbox JSON", () => {
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox",
        contents: [
          {
            kind: "category",
            name: "Properties",
            contents: []
          },
          {
            kind: "category",
            name: "General",
            contents: []
          },
          {
            kind: "category",
            name: "Actions",
            contents: []
          }
        ]
      });

      const categories = extractCategoriesFromToolbox(toolboxJson);
      expect(categories).toEqual(["Properties", "General", "Actions"]);
    });

    it("should return empty array for empty toolbox", () => {
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox",
        contents: []
      });

      const categories = extractCategoriesFromToolbox(toolboxJson);
      expect(categories).toEqual([]);
    });

    it("should handle toolbox without contents", () => {
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox"
      });

      const categories = extractCategoriesFromToolbox(toolboxJson);
      expect(categories).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      const categories = extractCategoriesFromToolbox("invalid json");
      expect(categories).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Could not parse toolbox JSON:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle toolbox with non-category items", () => {
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox",
        contents: [
          {
            kind: "category",
            name: "Properties",
            contents: []
          },
          {
            kind: "block",
            type: "controls_if"
          },
          {
            kind: "category",
            name: "General",
            contents: []
          }
        ]
      });

      const categories = extractCategoriesFromToolbox(toolboxJson);
      expect(categories).toEqual(["Properties", "General"]);
    });
  });

  describe("injectCustomBlocksIntoToolbox", () => {
    const mockCustomBlocks: ICustomBlock[] = [
      {
        category: "Properties",
        color: "#ff0000",
        config: { canHaveChildren: false },
        id: "custom_set_color_123",
        name: "color",
        type: "setter"
      },
      {
        category: "Actions",
        color: "#00ff00",
        config: { canHaveChildren: true },
        id: "custom_action_move_456",
        name: "move",
        type: "action"
      },
      {
        category: "General",
        color: "#0000ff",
        config: { canHaveChildren: false },
        id: "custom_create_particles_789",
        name: "particles",
        type: "creator"
      }
    ];

    it("should inject custom blocks into matching categories", () => {
      const toolboxJson = JSON.stringify({
        contents: [
          {
            contents: [],
            kind: "category",
            name: "Actions"
          },
          {
            contents: [],
            kind: "category",
            name: "General"
          },
          {
            contents: [],
            kind: "category",
            name: "Properties"
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, mockCustomBlocks);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(1);
      expect(parsed.contents[0].contents[0]).toEqual({
        kind: "block",
        type: "custom_action_move_456"
      });

      expect(parsed.contents[1].contents).toHaveLength(1);
      expect(parsed.contents[1].contents[0]).toEqual({
        kind: "block",
        type: "custom_create_particles_789"
      });

      expect(parsed.contents[2].contents).toHaveLength(1);
      expect(parsed.contents[2].contents[0]).toEqual({
        kind: "block",
        type: "custom_set_color_123"
      });
    });

    it("should add blocks to existing category contents", () => {
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox",
        contents: [
          {
            contents: [
              {
                kind: "block",
                type: "controls_if"
              }
            ],
            kind: "category",
            name: "Properties"
          }
        ]
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, [mockCustomBlocks[0]]);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(2);
      expect(parsed.contents[0].contents[0]).toEqual({
        kind: "block",
        type: "controls_if"
      });
      expect(parsed.contents[0].contents[1]).toEqual({
        kind: "block",
        type: "custom_set_color_123"
      });
    });

    it("should handle empty custom blocks array", () => {
      const toolboxJson = JSON.stringify({
        contents: [
          {
            kind: "category",
            name: "Properties",
            contents: []
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, []);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(0);
    });

    it("should handle toolbox without contents array", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      const toolboxJson = JSON.stringify({
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, mockCustomBlocks);
      expect(result).toBe(toolboxJson);
      expect(consoleSpy).toHaveBeenCalledWith("Toolbox does not have contents array");

      consoleSpy.mockRestore();
    });

    it("should handle invalid JSON gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      
      const result = injectCustomBlocksIntoToolbox("invalid json", mockCustomBlocks);
      expect(result).toBe("invalid json");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Could not inject custom blocks into toolbox:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle blocks with categories that don't exist in toolbox", () => {
      const toolboxJson = JSON.stringify({
        contents: [
          {
            contents: [],
            kind: "category",
            name: "Properties"
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, mockCustomBlocks);
      const parsed = JSON.parse(result);

      // Only the Properties block should be added
      expect(parsed.contents[0].contents).toHaveLength(1);
      expect(parsed.contents[0].contents[0]).toEqual({
        kind: "block",
        type: "custom_set_color_123"
      });
    });

    it("should handle multiple blocks in the same category", () => {
      const multipleBlocksInSameCategory: ICustomBlock[] = [
        {
          category: "Properties",
          color: "#ff0000",
          config: { canHaveChildren: false },
          id: "custom_set_color_123",
          name: "color",
          type: "setter"
        },
        {
          category: "Properties",
          color: "#ff0000",
          config: { canHaveChildren: false },
          id: "custom_set_speed_456",
          name: "speed",
          type: "setter"
        }
      ];

      const toolboxJson = JSON.stringify({
        contents: [
          {
            contents: [],
            kind: "category",
            name: "Properties"
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, multipleBlocksInSameCategory);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(2);
      expect(parsed.contents[0].contents[0]).toEqual({
        kind: "block",
        type: "custom_set_color_123"
      });
      expect(parsed.contents[0].contents[1]).toEqual({
        kind: "block",
        type: "custom_set_speed_456"
      });
    });

    it("should order blocks by type within the same category (creator before setter)", () => {
      const mixedTypeBlocks = [
        {
          category: "Properties",
          color: "#ff0000",
          config: { canHaveChildren: false },
          id: "custom_set_color_123",
          name: "Set Color",
          type: "setter" as const
        },
        {
          category: "Properties", 
          color: "#00ff00",
          config: { canHaveChildren: true },
          id: "custom_create_agent_456",
          name: "Create Agent",
          type: "creator" as const
        }
      ];

      const toolboxJson = JSON.stringify({
        contents: [
          {
            contents: [],
            kind: "category",
            name: "Properties"
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, mixedTypeBlocks);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(2);
      expect(parsed.contents[0].contents[0]).toEqual({
        kind: "block",
        type: "custom_create_agent_456"
      });
      expect(parsed.contents[0].contents[1]).toEqual({
        kind: "block",
        type: "custom_set_color_123"
      });
    });

    it("should include toolboxConfig for all built-in blocks that define one", () => {
      const blocksWithToolboxConfig = ALL_BUILT_IN_BLOCKS.filter(b => b.toolboxConfig);

      if (blocksWithToolboxConfig.length === 0) {
        console.warn("No built-in blocks with toolboxConfig found - test is not exercising any blocks.");
        return;
      }

      const customBlocks: ICustomBlock[] = blocksWithToolboxConfig.map(b => ({
        category: "Controls",
        color: b.color,
        config: { canHaveChildren: b.canHaveChildren },
        id: b.id,
        name: b.name,
        type: "builtIn"
      }));

      const toolboxJson = JSON.stringify({
        contents: [
          {
            contents: [],
            kind: "category",
            name: "Controls"
          }
        ],
        kind: "categoryToolbox"
      });

      const result = injectCustomBlocksIntoToolbox(toolboxJson, customBlocks);
      const parsed = JSON.parse(result);

      expect(parsed.contents[0].contents).toHaveLength(blocksWithToolboxConfig.length);

      // Verify each block's toolboxConfig is included in the toolbox entry
      blocksWithToolboxConfig.forEach((blockInfo) => {
        const injectedBlock = parsed.contents[0].contents.find((b: any) => b.type === blockInfo.id);
        expect(injectedBlock).toBeDefined();

        expect(injectedBlock.kind).toBe("block");
        expect(injectedBlock.type).toBe(blockInfo.id);

        // The toolboxConfig properties should be spread into the toolbox entry
        const expectedConfig = blockInfo.toolboxConfig as Record<string, unknown>;
        Object.keys(expectedConfig).forEach(key => {
          expect(injectedBlock[key]).toEqual(expectedConfig[key]);
        });
      });
    });
  });
});
