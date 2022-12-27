import { cssUrlValue } from "./css-url-value";

describe("cssUrlValue", () => {
  it("handles urls with spaces", () => {
    expect(cssUrlValue("https://example.com/foo bar baz.png")).toEqual(`url("https://example.com/foo%20bar%20baz.png")`);
  });

  it("handles urls with double quotes", () => {
    expect(cssUrlValue(`https://example.com/foo "bar" baz.png`)).toEqual(`url("https://example.com/foo%20%22bar%22%20baz.png")`);
  });
});
