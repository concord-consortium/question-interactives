import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test open response interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/open-response");
  });

  context("Runtime view", () => {
    it("renders prompt and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          extraInstructions: "Hints",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          response: [ "Test response" ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hints");

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
          extraInstructions: "Hints",
          defaultAnswer: "Default answer"
        }
      });
      phoneListen("interactiveState");

      cy.getIframeBody().find("textarea").type("test answer");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ response: "test answer" });
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
          extraInstructions: "Hints",
          defaultAnswer: "Default answer"
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Extra instructions");
      cy.getIframeBody().find("#app").should("include.text", "Default answer");

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt");
      cy.getIframeBody().find("#root_extraInstructions").should("have.value", "Hints");
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

      cy.getIframeBody().find("#root_extraInstructions").type("Hints");
      getAndClearLastPhoneMessage(state => {
        expect(state.extraInstructions).eql("Hints");
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
          extraInstructions: "Hints",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          response: [ "Test response" ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hints");

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Default answer");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");

      cy.getIframeBody().find("textarea").type("Ne answer", { force: true });

      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });
  });
});
