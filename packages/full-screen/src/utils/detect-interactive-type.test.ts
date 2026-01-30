import { detectInteractiveType } from "./detect-interactive-type";

describe("detectInteractiveType", () => {
  it("detects CODAP 2 production URLs", () => {
    expect(detectInteractiveType("https://codap.concord.org/app/static/dg/en/cert/index.html")).toBe("codap");
  });

  it("detects CODAP 3 production URLs", () => {
    expect(detectInteractiveType("https://codap3.concord.org/some/path")).toBe("codap");
  });

  it("detects CODAP URLs case-insensitively", () => {
    expect(detectInteractiveType("https://CODAP.CONCORD.ORG/app")).toBe("codap");
  });

  it("detects CODAP URLs with hash fragments", () => {
    expect(detectInteractiveType("https://codap.concord.org/app/static/dg/en/cert/index.html#shared=abc123")).toBe("codap");
  });

  it("detects CODAP URLs with query parameters", () => {
    expect(detectInteractiveType("https://codap.concord.org/app?documentId=123&interactiveApi")).toBe("codap");
  });

  it("returns null for non-CODAP URLs", () => {
    expect(detectInteractiveType("https://example.com/some/path")).toBeNull();
  });

  it("returns null for localhost URLs", () => {
    expect(detectInteractiveType("http://localhost:4020/dg")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectInteractiveType("")).toBeNull();
  });

  it("returns null for URLs with codap in path but not domain", () => {
    expect(detectInteractiveType("https://example.com/codap/app")).toBeNull();
  });
});
