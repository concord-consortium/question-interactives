import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test open response interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/open-response");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          answer: [ "Test response" ]
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage((hint) => {
        expect(hint).eql({ text: "Hint" });
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Default answer");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        }
      });
      phoneListen("interactiveState");

      cy.getIframeBody().find("textarea").type("test answer");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ type: "open_response_answer", answer: "test answer" });
      });
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");
      cy.getIframeBody().find("#app").should("include.text", "Default answer");

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("have.value", "Hint");
      cy.getIframeBody().find("#root_defaultAnswer").should("have.value", "Default answer");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).eql("Test prompt");
      });

      cy.getIframeBody().find("#root_hint").type("Hint");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("Hint");
      });

      cy.getIframeBody().find("#root_defaultAnswer").type("Default answer");
      getAndClearLastPhoneMessage(state => {
        expect(state.defaultAnswer).eql("Default answer");
      });
    });
  });

  context("Report view", () => {
    it("renders prompt and response and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          answer: [ "Test response" ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Default answer");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");

      cy.getIframeBody().find("textarea").type("New answer", { force: true });

      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });
  });
});
