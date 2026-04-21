import { BLOCKLY_BUILT_IN_BLOCKS } from "../blocks/blockly-built-in-registry";
import { CUSTOM_BUILT_IN_BLOCKS } from "../blocks/custom-built-in-blocks";
import { ICustomBlock, SEED_BLOCK_TYPES } from "../components/types";
import { buildValidTypeSet, hasAuthoredStarterContent, parseStarterProgram, pruneStarterState } from "./starter-utils";

const wrap = (blocks: Record<string, any>[]) => JSON.stringify({ blocks: { blocks } });

const seedOnly = () => wrap(SEED_BLOCK_TYPES.map((type, i) => ({
  type, x: 10, y: 10 + i * 70
})));

describe("starter-utils", () => {
  describe("parseStarterProgram", () => {
    it("returns null for undefined/empty", () => {
      expect(parseStarterProgram(undefined)).toBeNull();
      expect(parseStarterProgram("")).toBeNull();
    });
    it("returns null for malformed JSON", () => {
      expect(parseStarterProgram("not json")).toBeNull();
    });
    it("returns null when structure is missing blocks.blocks", () => {
      expect(parseStarterProgram(JSON.stringify({ foo: "bar" }))).toBeNull();
      expect(parseStarterProgram(JSON.stringify({ blocks: {} }))).toBeNull();
    });
    it("returns the full program when well-formed", () => {
      const blocks = [{ type: "setup" }];
      expect(parseStarterProgram(wrap(blocks))).toEqual({ blocks: { blocks } });
    });
  });

  describe("hasAuthoredStarterContent", () => {
    it("returns false for null", () => {
      expect(hasAuthoredStarterContent(null)).toBe(false);
    });
    it("returns false for undefined/empty input (via parseStarterProgram)", () => {
      expect(hasAuthoredStarterContent(parseStarterProgram(undefined))).toBe(false);
      expect(hasAuthoredStarterContent(parseStarterProgram(""))).toBe(false);
    });
    it("returns false for malformed JSON (via parseStarterProgram)", () => {
      expect(hasAuthoredStarterContent(parseStarterProgram("not json"))).toBe(false);
    });
    it("returns false for seed-only content", () => {
      expect(hasAuthoredStarterContent(parseStarterProgram(seedOnly()))).toBe(false);
    });
    it("returns true when a seed block has nested input content", () => {
      const raw = wrap([
        { type: "setup", inputs: { DO: { block: { type: "someChild" } } } }
      ]);
      expect(hasAuthoredStarterContent(parseStarterProgram(raw))).toBe(true);
    });
    it("returns true when a seed block has a next chain", () => {
      const raw = wrap([
        { type: "go", next: { block: { type: "someChild" } } }
      ]);
      expect(hasAuthoredStarterContent(parseStarterProgram(raw))).toBe(true);
    });
    it("returns true when a non-seed top block is present", () => {
      const raw = wrap([{ type: "customBlock123" }]);
      expect(hasAuthoredStarterContent(parseStarterProgram(raw))).toBe(true);
    });
  });

  describe("buildValidTypeSet", () => {
    it("includes seed types, built-ins, and custom block ids", () => {
      const customBlocks: ICustomBlock[] = [
        { id: "custom_1", name: "", category: "", color: "", type: "action", config: { canHaveChildren: false } }
      ];
      const set = buildValidTypeSet(customBlocks);
      SEED_BLOCK_TYPES.forEach(t => expect(set.has(t)).toBe(true));
      BLOCKLY_BUILT_IN_BLOCKS.forEach(b => expect(set.has(b.id)).toBe(true));
      CUSTOM_BUILT_IN_BLOCKS.forEach(b => expect(set.has(b.id)).toBe(true));
      expect(set.has("custom_1")).toBe(true);
      expect(set.has("unknown_block_id")).toBe(false);
    });
  });

  describe("pruneStarterState", () => {
    const valid = new Set<string>([...SEED_BLOCK_TYPES, "ok"]);

    it("leaves a valid-only state unchanged (structurally)", () => {
      const raw = wrap([
        { type: "setup", inputs: { DO: { block: { type: "ok" } } } }
      ]);
      const out = JSON.parse(pruneStarterState(raw, valid));
      expect(out.blocks.blocks).toEqual([
        { type: "setup", inputs: { DO: { block: { type: "ok" } } } }
      ]);
    });

    it("drops an unknown top-level block but preserves siblings", () => {
      const raw = wrap([
        { type: "setup" },
        { type: "gone" },
        { type: "go" }
      ]);
      const out = JSON.parse(pruneStarterState(raw, valid));
      expect(out.blocks.blocks.map((b: any) => b.type)).toEqual(["setup", "go"]);
    });

    it("drops an unknown inner block and removes the now-empty inputs key", () => {
      const raw = wrap([
        { type: "setup", inputs: { DO: { block: { type: "gone" } } } }
      ]);
      const out = JSON.parse(pruneStarterState(raw, valid));
      expect(out.blocks.blocks[0].inputs).toBeUndefined();
    });

    it("preserves sibling inputs when one is pruned", () => {
      const raw = wrap([
        {
          type: "setup",
          inputs: {
            A: { block: { type: "gone" } },
            B: { block: { type: "ok" } }
          }
        }
      ]);
      const out = JSON.parse(pruneStarterState(raw, valid));
      expect(out.blocks.blocks[0].inputs).toEqual({ B: { block: { type: "ok" } } });
    });

    it("drops the tail of a next chain after an unknown link", () => {
      const raw = wrap([
        {
          type: "go",
          next: {
            block: {
              type: "ok",
              next: {
                block: {
                  type: "gone",
                  next: { block: { type: "ok" } }
                }
              }
            }
          }
        }
      ]);
      const out = JSON.parse(pruneStarterState(raw, valid));
      const go = out.blocks.blocks[0];
      expect(go.type).toBe("go");
      expect(go.next.block.type).toBe("ok");
      expect(go.next.block.next).toBeUndefined();
    });
  });
});
