import { ICustomBlock } from "../components/types";

export const extractCategoriesFromToolbox = (toolboxJson: string): string[] => {
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

    // Inject custom blocks into their assigned categories
    toolbox.contents.forEach((item: any) => {
      if (item.kind === "category" && item.name && blocksByCategory[item.name]) {
        // Ensure contents array exists
        if (!item.contents) {
          item.contents = [];
        }
        
        // Add custom blocks to this category
        blocksByCategory[item.name].forEach(block => {
          item.contents.push({
            kind: "block",
            type: block.id
          });
        });
      }
    });

    return JSON.stringify(toolbox);
  } catch (error) {
    console.warn("Could not inject custom blocks into toolbox:", error);
    return toolboxJson;
  }
};
