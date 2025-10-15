import { BLOCKLY_BUILT_IN_BLOCKS } from "./blockly-built-in-registry";

describe("blockly-built-in-registry", () => {
  describe("BLOCKLY_BUILT_IN_BLOCKS", () => {
    it("should contain the expected Blockly built-in blocks", () => {
      expect(BLOCKLY_BUILT_IN_BLOCKS).toHaveLength(3);
      
      const blockIds = BLOCKLY_BUILT_IN_BLOCKS.map(block => block.id);
      expect(blockIds).toContain("controls_if");
      expect(blockIds).toContain("logic_operation");
      expect(blockIds).toContain("logic_negate");
      
      const blockNames = BLOCKLY_BUILT_IN_BLOCKS.map(block => block.name);
      expect(blockNames).toContain("if");
      expect(blockNames).toContain("and/or");
      expect(blockNames).toContain("not");
    });

    it("should have correct types and properties", () => {
      BLOCKLY_BUILT_IN_BLOCKS.forEach(block => {
        expect(block.type).toBe("built-in");
        expect(block.id).toBeTruthy();
        expect(block.name).toBeTruthy();
        expect(block.description).toBeTruthy();
        expect(block.color).toBeTruthy();
        expect(typeof block.hasStatements).toBe("boolean");
      });
    });
  });
});
