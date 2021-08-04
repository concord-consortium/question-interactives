import { cssUrlValue } from "./css-url-value";

describe("cssUrlValue", () => {
  it("handles urls with spaces", () => {
    expect(cssUrlValue("https://example.com/foo bar baz.ping")).toEqual(`url("https://example.com/foo bar baz.ping")`);
  });

  it("handles urls with double quotes", () => {
    expect(cssUrlValue(`https://example.com/foo "bar" baz.ping`)).toEqual(`url("https://example.com/foo \\"bar\\" baz.ping")`);
  });
});
