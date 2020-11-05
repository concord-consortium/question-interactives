import { libraryInteractiveIdToUrl } from "./library-interactives";

describe("libraryInteractiveIdToUrl", () => {
  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = {
      href: "http://question-interactives/version/0.5.0/scaffolded-question"
    };
  });

  it("converts temporal ID (path segment) to full URL using the current URL", () => {
    expect(libraryInteractiveIdToUrl("open-response")).toEqual("http://question-interactives/version/0.5.0/open-response");
  });
});
