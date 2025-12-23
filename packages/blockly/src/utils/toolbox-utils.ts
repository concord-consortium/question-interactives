import { ICustomBlock } from "../components/types";
import { ALL_BUILT_IN_BLOCKS, BLOCK_TYPE_ORDER } from "../blocks/block-constants";

// Collects `toolboxConfig` from all built-in blocks that define one.
const BLOCK_TOOLBOX_CONFIGS: Record<string, object> = ALL_BUILT_IN_BLOCKS.reduce(
  (acc, block) => {
    if (block.toolboxConfig) {
      acc[block.id] = block.toolboxConfig;
    }
    return acc;
  },
  {} as Record<string, object>
);

// Constructs the toolbox entry for a block, including any special configuration.
const toolboxBlockEntry = (blockId: string) => {
  const config = BLOCK_TOOLBOX_CONFIGS[blockId];
  if (config) {
    return { kind: "block", type: blockId, ...config };
  }
  return { kind: "block", type: blockId };
};

export const extractCategoriesFromToolbox = (toolboxJson: string): string[] => {
  if (!toolboxJson || !toolboxJson.trim()) return [];

  try {
    const toolbox = JSON.parse(toolboxJson);
    const categories: string[] = [];
    
    if (toolbox.contents && Array.isArray(toolbox.contents)) {
      toolbox.contents.forEach((item: any) => {
        if (item.kind === "category" && item.name) {
          categories.push(item.name);
        }
      });
    }
    
    return categories;
  } catch (error) {
    console.warn("Could not parse toolbox JSON:", error);
    return [];
  }
};

export const injectCustomBlocksIntoToolbox = (toolboxJson: string, customBlocks: ICustomBlock[]): string => {
  try {
    const toolbox = JSON.parse(toolboxJson);

    if (!toolbox.contents || !Array.isArray(toolbox.contents)) {
      console.warn("Toolbox does not have contents array");
      return toolboxJson;
    }

    // Group custom blocks by category
    const blocksByCategory: { [category: string]: ICustomBlock[] } = {};
    customBlocks.forEach(block => {
      if (!blocksByCategory[block.category]) {
        blocksByCategory[block.category] = [];
      }
      blocksByCategory[block.category].push(block);
    });

    // Sort blocks within each category by type order
    const typeOrderMap = new Map(
      BLOCK_TYPE_ORDER.map((type, index) => [type, index])
    );
    Object.keys(blocksByCategory).forEach(category => {
      blocksByCategory[category].sort((a, b) => {
        const aIndex = typeOrderMap.get(a.type) ?? BLOCK_TYPE_ORDER.length;
        const bIndex = typeOrderMap.get(b.type) ?? BLOCK_TYPE_ORDER.length;
        return aIndex - bIndex;
      });
    });

    // Inject custom blocks into their assigned categories
    toolbox.contents.forEach((item: any) => {
      if (item.kind === "category" && item.name && blocksByCategory[item.name]) {
        // Ensure contents array exists
        if (!item.contents) {
          item.contents = [];
        }

        // Add custom blocks to this category
        blocksByCategory[item.name].forEach(block => {
          item.contents.push(toolboxBlockEntry(block.id));
        });
      }
    });

    return JSON.stringify(toolbox);
  } catch (error) {
    console.warn("Could not inject custom blocks into toolbox:", error);
    return toolboxJson;
  }
};
