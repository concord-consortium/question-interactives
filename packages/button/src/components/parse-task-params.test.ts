import { parseTaskParams } from "./button";

describe("parseTaskParams", () => {
  it("returns empty object for undefined", () => {
    expect(parseTaskParams(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseTaskParams("")).toEqual({});
  });

  it("returns empty object for whitespace-only string", () => {
    expect(parseTaskParams("   ")).toEqual({});
    expect(parseTaskParams("\n\n")).toEqual({});
  });

  it("parses query string format", () => {
    expect(parseTaskParams("key1=value1&key2=value2")).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("parses newline-separated format", () => {
    expect(parseTaskParams("key1=value1\nkey2=value2")).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("parses mixed newline and ampersand format", () => {
    expect(parseTaskParams("key1=value1\nkey2=value2&key3=value3")).toEqual({
      key1: "value1",
      key2: "value2",
      key3: "value3",
    });
  });

  it("URL-decodes values", () => {
    expect(parseTaskParams("message=Hello%20World&name=foo%26bar")).toEqual({
      message: "Hello World",
      name: "foo&bar",
    });
  });

  it("URL-decodes keys", () => {
    expect(parseTaskParams("my%20key=value")).toEqual({
      "my key": "value",
    });
  });

  it("handles empty values", () => {
    expect(parseTaskParams("key1=&key2=value2")).toEqual({
      key1: "",
      key2: "value2",
    });
  });

  it("skips entries with empty keys", () => {
    expect(parseTaskParams("=value&key1=value1")).toEqual({
      key1: "value1",
    });
  });

  it("handles single key-value pair", () => {
    expect(parseTaskParams("onlykey=onlyvalue")).toEqual({
      onlykey: "onlyvalue",
    });
  });

  it("handles Windows-style \\r\\n line endings", () => {
    expect(parseTaskParams("key1=value1\r\nkey2=value2")).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("handles bare \\r line endings", () => {
    expect(parseTaskParams("key1=value1\rkey2=value2")).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });
});
