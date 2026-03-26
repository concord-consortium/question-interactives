import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugify("Hello: World!")).toBe("hello-world");
  });

  it("collapses consecutive special characters into a single hyphen", () => {
    expect(slugify("foo --- bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
    expect(slugify("!hello!")).toBe("hello");
  });

  it("returns fallback for empty string", () => {
    expect(slugify("")).toBe("demo");
  });

  it("returns fallback for string with only special characters", () => {
    expect(slugify("!@#$%")).toBe("demo");
  });

  it("accepts a custom fallback", () => {
    expect(slugify("", "default")).toBe("default");
  });

  it("handles mixed case", () => {
    expect(slugify("FooBar")).toBe("foobar");
  });

  it("preserves numbers", () => {
    expect(slugify("test 123")).toBe("test-123");
  });
});
