import { INestedBlock } from "../components/types";
import { wouldCreateCircularReference } from "./nested-block-utils";

describe("Nested Block Tree Utilities", () => {
  describe("wouldCreateCircularReference", () => {
    const nestedBlocks: INestedBlock[] = [
      {
          blockId: "block1",
          children: [
            {
              blockId: "block1a",
              children: [{ blockId: "block1a1" }]
            }
          ]
      },
      { blockId: "block2" }
    ];

    it("should detect direct circular reference (block to itself)", () => {
      expect(wouldCreateCircularReference(nestedBlocks, "block1", "block1")).toBe(true);
    });

    it("should detect indirect circular reference (child contains parent)", () => {
      // Trying to add block1 as a child of block1a (which is already a child of block1)
      expect(wouldCreateCircularReference(nestedBlocks, "block1a", "block1")).toBe(true);
    });

    it("should detect deep circular reference", () => {
      // Trying to add block1 as a child of block1a1 (which is nested under block1)
      expect(wouldCreateCircularReference(nestedBlocks, "block1a1", "block1")).toBe(true);
    });

    it("should allow valid parent-child relationship", () => {
      // Adding block2 as a child of block1 is fine
      expect(wouldCreateCircularReference(nestedBlocks, "block1", "block2")).toBe(false);
    });

    it("should allow adding new blocks", () => {
      expect(wouldCreateCircularReference(nestedBlocks, "block1", "newBlock")).toBe(false);
    });
  });
});

