import Blockly, { Blocks, utils } from "blockly/core";
import * as En from "blockly/msg/en";

// controls_if is the child block the connected-parent test needs. The English messages are what
// Blockly composes ARIA labels from -- inject() cannot even build a workspace without them, and
// importing blockly/core alone does not load them.
import "blockly/blocks";
import "./starter-blocks";

Blockly.setLocale(En as unknown as {[key: string]: string});

describe("Starter Blocks", () => {
  it("should register blocks in Blockly.Blocks", () => {
    expect(typeof Blocks.setup).toBe("object");
    expect(typeof Blocks.setup.init).toBe("function");
    expect(typeof Blocks.go).toBe("object");
    expect(typeof Blocks.go.init).toBe("function");
    expect(typeof Blocks.onclick).toBe("object");
    expect(typeof Blocks.onclick.init).toBe("function");
  });

  // Each seed block carries a decorative icon beside its text label. A plain FieldImage with an
  // empty alt contributes Msg.FIELD_LABEL_EMPTY -- the lowercase word "empty" -- to the block's
  // ARIA label, so a screen reader heard "setup, empty" whether or not the block held any
  // children, and our move announcements inherited the lie: "if, do connected inside setup, empty".
  describe("the seed blocks' accessible names", () => {
    let workspace: Blockly.WorkspaceSvg | null = null;

    beforeEach(() => {
      document.body.innerHTML = '<div id="workspace"></div>';
      const el = document.getElementById("workspace");
      if (!el) throw new Error("workspace element not found");
      workspace = Blockly.inject(el, { trashcan: false, toolbox: undefined });
    });

    afterEach(() => {
      workspace?.dispose();
      workspace = null;
      document.body.innerHTML = "";
    });

    const renderBlock = (type: string) => {
      if (!workspace) throw new Error("workspace not injected");
      const block = workspace.newBlock(type) as Blockly.BlockSvg;
      block.initSvg();
      block.render();
      return block;
    };

    it.each([
      ["setup", "setup"],
      ["go", "go"],
      ["onclick", "on mouse click"]
    ])("names the %s block after its text label, with no decorative icon in it", (type, label) => {
      const block = renderBlock(type);

      expect(block.getAriaLabel(utils.aria.Verbosity.TERSE)).toBe(label);

      const standard = block.getAriaLabel(utils.aria.Verbosity.STANDARD);
      expect(standard).toContain(label);
      expect(standard).not.toContain("empty");
    });

    // The old label was not merely noisy, it was wrong: it said "empty" just as loudly with a
    // child connected as without one, which is what made the move announcement misleading.
    it("still names setup after its label once a block is connected inside it", () => {
      const setup = renderBlock("setup");
      const child = renderBlock("controls_if");

      const statementConnection = setup.getInput("statements")?.connection;
      const previousConnection = child.previousConnection;
      if (!statementConnection || !previousConnection) throw new Error("expected both connections");
      statementConnection.connect(previousConnection);
      expect(child.getParent()).toBe(setup);

      // This is the exact pair our move announcement composes: "if, do connected inside setup."
      expect(child.getAriaLabel(utils.aria.Verbosity.TERSE)).toBe("if, do");
      expect(setup.getAriaLabel(utils.aria.Verbosity.TERSE)).toBe("setup");
    });
  });
});
