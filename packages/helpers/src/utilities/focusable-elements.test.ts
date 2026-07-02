import { getFocusableElements } from "./focusable-elements";

const setBody = (html: string) => {
  document.body.innerHTML = html;
};

describe("getFocusableElements", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns focusable elements in DOM order", () => {
    setBody(`
      <button id="b1">one</button>
      <a id="a1" href="#">link</a>
      <input id="i1" />
      <textarea id="t1"></textarea>
      <select id="s1"></select>
    `);
    const ids = getFocusableElements(document.body).map(el => el.id);
    expect(ids).toEqual(["b1", "a1", "i1", "t1", "s1"]);
  });

  it("excludes disabled form controls", () => {
    setBody(`
      <button id="b1">one</button>
      <button id="b2" disabled>two</button>
      <input id="i1" disabled />
    `);
    const ids = getFocusableElements(document.body).map(el => el.id);
    expect(ids).toEqual(["b1"]);
  });

  it("excludes tabindex=-1 and includes tabindex 0 / positive", () => {
    setBody(`
      <div id="d1" tabindex="-1">skip</div>
      <div id="d2" tabindex="0">keep</div>
      <div id="d3" tabindex="2">keep</div>
    `);
    const ids = getFocusableElements(document.body).map(el => el.id);
    expect(ids).toEqual(["d2", "d3"]);
  });

  it("excludes elements hidden via display:none, visibility:hidden, or the hidden attribute", () => {
    setBody(`
      <button id="b1">visible</button>
      <button id="b2" style="display:none">none</button>
      <button id="b3" style="visibility:hidden">hidden</button>
      <button id="b4" hidden>attr</button>
    `);
    const ids = getFocusableElements(document.body).map(el => el.id);
    expect(ids).toEqual(["b1"]);
  });

  it("excludes elements hidden by an ancestor's display:none", () => {
    setBody(`
      <button id="b1">visible</button>
      <div style="display:none">
        <button id="b2">ancestor-hidden</button>
      </div>
    `);
    const ids = getFocusableElements(document.body).map(el => el.id);
    expect(ids).toEqual(["b1"]);
  });

  it("defaults the root to document", () => {
    setBody(`<button id="b1">one</button>`);
    const ids = getFocusableElements().map(el => el.id);
    expect(ids).toEqual(["b1"]);
  });
});
