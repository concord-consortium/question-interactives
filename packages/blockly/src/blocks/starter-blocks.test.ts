import { Blocks } from "blockly/core";

import "./starter-blocks";

describe("Starter Blocks", () => {
  it("should register blocks in Blockly.Blocks", () => {
    expect(typeof Blocks.setup).toBe("object");
    expect(typeof Blocks.setup.init).toBe("function");
    expect(typeof Blocks.go).toBe("object");
    expect(typeof Blocks.go.init).toBe("function");
    expect(typeof Blocks.onclick).toBe("object");
    expect(typeof Blocks.onclick.init).toBe("function");
  });
});
