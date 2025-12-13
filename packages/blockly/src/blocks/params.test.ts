import Blockly, { FieldDropdown, FieldNumber } from "blockly/core";
import { IParameter } from "../components/types";
import { appendParameterFields, applyParameterDefaults } from "./params";

jest.mock("blockly/core", () => ({
  FieldDropdown: jest.fn().mockImplementation((options) => ({
    options,
    setValue: jest.fn()
  })),
  FieldNumber: jest.fn().mockImplementation((defaultValue) => ({
    defaultValue,
    setValue: jest.fn()
  }))
}));

describe("params", () => {
  let mockInput: Blockly.Input;
  let mockBlockInstance: Blockly.Block;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockInput = {
      appendField: jest.fn().mockReturnThis()
    } as unknown as Blockly.Input;

    mockBlockInstance = {
      setFieldValue: jest.fn()
    } as unknown as Blockly.Block;
  });

  describe("appendParameterFields", () => {
    it("handles undefined params gracefully", () => {
      appendParameterFields(mockInput, undefined, mockBlockInstance);
      expect(mockInput.appendField).not.toHaveBeenCalled();
    });

    it("handles empty params array", () => {
      appendParameterFields(mockInput, [], mockBlockInstance);
      expect(mockInput.appendField).not.toHaveBeenCalled();
    });

    it("appends select parameter with prefix label", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "target",
        labelText: "to",
        labelPosition: "prefix",
        options: [
          { label: "Alice", value: "alice" },
          { label: "Bob", value: "bob" }
        ]
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(mockInput.appendField).toHaveBeenCalledWith("to");
      expect(FieldDropdown).toHaveBeenCalledWith([
        ["Alice", "alice"],
        ["Bob", "bob"]
      ]);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "target");
    });

    it("appends select parameter with suffix label", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "direction",
        labelText: "steps",
        labelPosition: "suffix",
        options: [
          { label: "forward", value: "FWD" },
          { label: "backward", value: "BWD" }
        ]
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      const calls = (mockInput.appendField as jest.Mock).mock.calls;
      expect(calls[0][0]).toEqual(expect.any(Object)); // FieldDropdown
      expect(calls[0][1]).toBe("direction");
      expect(calls[1][0]).toBe("steps");
    });

    it("appends select parameter without label", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "choice",
        options: [
          { label: "Option A", value: "A" },
          { label: "Option B", value: "B" }
        ]
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldDropdown).toHaveBeenCalledWith([
        ["Option A", "A"],
        ["Option B", "B"]
      ]);
      expect(mockInput.appendField).toHaveBeenCalledTimes(1);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "choice");
    });

    it("normalizes array format options to [label, value] pairs", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "color",
        options: [
          ["Red", "RED"],
          ["Blue", "BLUE"]
        ] as any
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldDropdown).toHaveBeenCalledWith([
        ["Red", "RED"],
        ["Blue", "BLUE"]
      ]);
    });

    it("filters invalid options", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "test",
        options: [
          { label: "Valid", value: "V" },
          { label: "NoValue" } as any,
          { value: "NoLabel" } as any,
          null as any,
          "invalid" as any,
          ["Good", "G"],
          ["Bad"] as any
        ] as any
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldDropdown).toHaveBeenCalledWith([
        ["Valid", "V"],
        ["Good", "G"]
      ]);
    });

    it("does not append select parameter with no valid options", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "empty",
        options: []
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldDropdown).not.toHaveBeenCalled();
      expect(mockInput.appendField).not.toHaveBeenCalled();
    });

    it("appends number parameter with default value", () => {
      const params: IParameter[] = [{
        kind: "number",
        name: "speed",
        defaultValue: 5
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldNumber).toHaveBeenCalledWith(5);
      expect(mockInput.appendField).toHaveBeenCalledWith(expect.any(Object), "speed");
    });

    it("appends number parameter with zero as default", () => {
      const params: IParameter[] = [{
        kind: "number",
        name: "count"
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(FieldNumber).toHaveBeenCalledWith(0);
    });

    it("sets default value for select parameter using defaultOptionValue", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "color",
        defaultOptionValue: "BLUE",
        options: [
          { label: "Red", value: "RED" },
          { label: "Blue", value: "BLUE" }
        ]
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith("BLUE", "color");
    });

    it("sets default value for select parameter using defaultValue fallback", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "size",
        defaultValue: "LARGE",
        options: [
          { label: "Small", value: "SMALL" },
          { label: "Large", value: "LARGE" }
        ]
      }];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith("LARGE", "size");
    });

    it("handles setFieldValue errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
      (mockBlockInstance.setFieldValue as jest.Mock).mockImplementation(() => {
        throw new Error("Field not found");
      });

      const params: IParameter[] = [{
        kind: "select",
        name: "test",
        defaultOptionValue: "VALUE",
        options: [{ label: "Test", value: "VALUE" }]
      }];

      expect(() => {
        appendParameterFields(mockInput, params, mockBlockInstance);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("appends multiple parameters with mixed types", () => {
      const params: IParameter[] = [
        {
          kind: "select",
          name: "direction",
          labelText: "move",
          labelPosition: "prefix",
          options: [{ label: "forward", value: "FWD" }]
        },
        {
          kind: "number",
          name: "distance",
          defaultValue: 10
        },
        {
          kind: "select",
          name: "units",
          labelText: "meters",
          labelPosition: "suffix",
          options: [{ label: "m", value: "M" }]
        }
      ];

      appendParameterFields(mockInput, params, mockBlockInstance);

      expect(mockInput.appendField).toHaveBeenCalledWith("move");
      expect(FieldDropdown).toHaveBeenCalledTimes(2);
      expect(FieldNumber).toHaveBeenCalledWith(10);
      expect(mockInput.appendField).toHaveBeenCalledWith("meters");
    });
  });

  describe("applyParameterDefaults", () => {
    it("handles undefined params gracefully", () => {
      applyParameterDefaults(mockBlockInstance, undefined);
      expect(mockBlockInstance.setFieldValue).not.toHaveBeenCalled();
    });

    it("handles empty params array", () => {
      applyParameterDefaults(mockBlockInstance, []);
      expect(mockBlockInstance.setFieldValue).not.toHaveBeenCalled();
    });

    it("applies default for select parameter using defaultOptionValue", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "color",
        defaultOptionValue: "RED",
        options: []
      }];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith("RED", "color");
    });

    it("applies default for select parameter using defaultValue fallback", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "size",
        defaultValue: "MEDIUM",
        options: []
      }];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith("MEDIUM", "size");
    });

    it("applies default for number parameter", () => {
      const params: IParameter[] = [{
        kind: "number",
        name: "speed",
        defaultValue: 42
      }];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith(42, "speed");
    });

    it("applies defaults for multiple parameters", () => {
      const params: IParameter[] = [
        {
          kind: "select",
          name: "type",
          defaultOptionValue: "FAST",
          options: []
        },
        {
          kind: "number",
          name: "count",
          defaultValue: 100
        }
      ];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith("FAST", "type");
      expect(mockBlockInstance.setFieldValue).toHaveBeenCalledWith(100, "count");
    });

    it("skips select parameter without default", () => {
      const params: IParameter[] = [{
        kind: "select",
        name: "choice",
        options: []
      }];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).not.toHaveBeenCalled();
    });

    it("skips number parameter without default", () => {
      const params: IParameter[] = [{
        kind: "number",
        name: "value"
      }];

      applyParameterDefaults(mockBlockInstance, params);

      expect(mockBlockInstance.setFieldValue).not.toHaveBeenCalled();
    });

    it("handles setFieldValue errors gracefully for select parameters", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
      (mockBlockInstance.setFieldValue as jest.Mock).mockImplementation(() => {
        throw new Error("Field error");
      });

      const params: IParameter[] = [{
        kind: "select",
        name: "test",
        defaultOptionValue: "VALUE",
        options: []
      }];

      expect(() => {
        applyParameterDefaults(mockBlockInstance, params);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles setFieldValue errors gracefully for number parameters", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
      (mockBlockInstance.setFieldValue as jest.Mock).mockImplementation(() => {
        throw new Error("Field error");
      });

      const params: IParameter[] = [{
        kind: "number",
        name: "count",
        defaultValue: 5
      }];

      expect(() => {
        applyParameterDefaults(mockBlockInstance, params);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
