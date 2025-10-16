import { INestedBlock } from "../components/types";

export const wouldCreateCircularReference = (
  nestedBlocks: INestedBlock[],
  parentBlockId: string,
  childBlockId: string
): boolean => {
  if (parentBlockId === childBlockId) return true;

  const contains = (blocks: INestedBlock[], targetId: string): boolean => {
    for (const block of blocks) {
      if (block.blockId === targetId) return true;
      if (block.children && block.children.length > 0) {
        if (contains(block.children, targetId)) return true;
      }
    }
    return false;
  };

  const findChild = (blocks: INestedBlock[]): INestedBlock | null => {
    for (const block of blocks) {
      if (block.blockId === childBlockId) return block;
      if (block.children && block.children.length > 0) {
        const found = findChild(block.children);
        if (found) return found;
      }
    }
    return null;
  };

  const childBlock = findChild(nestedBlocks);
  if (childBlock && childBlock.children) {
    return contains(childBlock.children, parentBlockId);
  }

  return false;
};
