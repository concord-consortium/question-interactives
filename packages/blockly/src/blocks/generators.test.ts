import { BlockSvg } from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { ICustomBlock, IBlockConfig } from "../components/types";
import { replaceParameters } from "../utils/block-utils";
import { createGenerator } from "./generators";

jest.mock("../utils/block-utils", () => ({
  replaceParameters: jest.fn()
}));

const mockBlockConfig: IBlockConfig = {
  canHaveChildren: false,
  inputsInline: true,
  nextStatement: true,
  options: [],
  previousStatement: true
};

const mockBlock: ICustomBlock = {
  category: "Test",
  color: "#abacab",
  config: mockBlockConfig,
  id: "custom_block_1",
  name: "Test Block",
  type: "builtIn" as const
};

describe("createGenerator unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (javascriptGenerator.statementToCode as jest.Mock) = jest.fn().mockReturnValue("");
  });

  it("action: uses generatorTemplate and replaces ${ACTION}", () => {
    const def = {
      ...mockBlock,
      name: "Do Thing",
      type: "action" as const
    };
    const cfg = {
      ...mockBlockConfig,
      generatorTemplate: "CALL ${ACTION}(${P1})",
      parameters: []
    };
    (replaceParameters as jest.Mock).mockImplementation((s) => s.replace("${P1}", "42"));
    const gen = createGenerator(def, cfg);
    const block = { getFieldValue: jest.fn(), getInput: () => null } as unknown as BlockSvg;
    const out = gen(block);

    expect(replaceParameters).toHaveBeenCalled();
    expect(String(out)).toBe("CALL do_thing(42)\n");
  });

  it("action: fallback builds parts from parameters with prefix/suffix labels", () => {
    const def = {
      ...mockBlock,
      name: "Jump",
      type: "action" as const
    };
    const cfg = {
      ...mockBlockConfig,
      parameters: [
        {
          kind: "select" as const,
          labelPosition: "suffix" as const,
          labelText: "to",
          name: "who",
          options: []
        }
      ]
    };
    const block = {
      getFieldValue: (n: string) => (n === "who" ? "Alice" : undefined)
    }  as unknown as BlockSvg;
    const gen = createGenerator(def, cfg);
    const out = gen(block);

    expect(String(out)).toBe("jump Alice to\n");
  });

  it("setter: returns set_<name> with quoted value", () => {
    const def = {
      ...mockBlock,
      name: "Color",
      type: "setter" as const
    };
    const cfg = mockBlockConfig;
    const block = {
      getFieldValue: (n: string) => (n === "value" ? "RED" : undefined)
    } as unknown as BlockSvg;
    const gen = createGenerator(def, cfg);
    const out = gen(block);

    expect(String(out)).toBe('set_color(agent, "RED");\n');
  });

  it("creator: includes callback when statements exist", () => {
    const def = {
      ...mockBlock,
      name: "Thing",
      type: "creator" as const
    };
    const cfg = mockBlockConfig;
    (javascriptGenerator.statementToCode as jest.Mock).mockReturnValue("  doSomething();\n");
    const block = {
      getFieldValue: (n: string) => (n === "count" ? 3 : (n === "type" ? "ThingType" : undefined)),
      getInput: (n: string) => (n === "statements" ? {} : null)
    } as unknown as BlockSvg;
    const gen = createGenerator(def, cfg);
    const out = gen(block);

    expect(String(out)).toContain("create_thingtype(3, (agent) => {");
    expect(String(out)).toContain("doSomething();\n");
  });

  it("ask: uses sim.actors for 'all' target and wraps statements", () => {
    const def = {
      ...mockBlock,
      name: "ask",
      type: "ask" as const
    };
    const cfg = mockBlockConfig;
    (javascriptGenerator.statementToCode as jest.Mock).mockReturnValue("  foo();\n");
    const block = {
      getFieldValue: (n: string) => (n === "target" ? "all" : undefined),
      getInput: (n: string) => (n === "statements" ? {} : null)
    } as unknown as BlockSvg;
    const gen = createGenerator(def, cfg);
    const out = gen(block);

    expect(String(out)).toContain("sim.actors.forEach");
    expect(String(out)).toContain("foo();\n");
  });

  it("condition: with generatorTemplate returns [code, Order.ATOMIC] and replaces condition placeholder", () => {
    const def = {
      ...mockBlock,
      name: "When",
      type: "condition" as const
    };
    const cfg = {
      ...mockBlockConfig,
      generatorTemplate: "(${CONDITION}) && extra",
      parameters: []
    };
    (replaceParameters as jest.Mock).mockReturnValue("(${CONDITION}) && extra");
    const block = {
      getFieldValue: (n: string) => (n === "condition" ? "x>0" : undefined)
    } as unknown as BlockSvg;
    const gen = createGenerator(def, cfg);
    const res = gen(block);

    expect(Array.isArray(res)).toBe(true);
    expect(res[1]).toBe(Order.ATOMIC);
    expect(String(res[0])).toContain("x>0");
  });
});
