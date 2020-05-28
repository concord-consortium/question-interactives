import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test fill in the blank interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/fill-in-the-blank");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt with [blank-1] and [blank-2]",
          hint: "Hint",
          blanks: [
            {id: "[blank-1]", size: 10},
            {id: "[blank-2]", size: 20},
          ]
        },
        interactiveState: {
          blanks: [
            {id: "[blank-1]", response: "Test response"}
          ]
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage((hint) => {
        expect(hint).eql("Hint");
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt with ");

      cy.getIframeBody().find("input").eq(0).should("have.value", "Test response");
      cy.getIframeBody().find("input").eq(1).should("have.value", "");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt with [blank-1] and [blank-2]",
          blanks: [
            {id: "[blank-1]", size: 10},
            {id: "[blank-2]", size: 20},
          ]
        }
      });
      phoneListen("interactiveState");

      cy.getIframeBody().find("input").eq(0).type("Test response");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({
          blanks: [
            {id: "[blank-1]", response: "Test response"}
          ]
        });
      });
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          prompt: "Test prompt with [blank-1] and [blank-2]",
          hint: "Hint",
          blanks: [
            {id: "[blank-1]", size: 10},
            {id: "[blank-2]", size: 20, matchTerm: "test match term"},
          ]
        },
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");
      cy.getIframeBody().find("#app").should("include.text", "Blank field options");

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt with [blank-1] and [blank-2]");
      cy.getIframeBody().find("#root_hint").should("have.value", "Hint");

      cy.getIframeBody().find("#root_blanks_0_id").should("have.value", "[blank-1]");
      cy.getIframeBody().find("#root_blanks_0_id").should("have.attr", "readonly");
      cy.getIframeBody().find("#root_blanks_0_size").should("have.value", "10");
      cy.getIframeBody().find("#root_blanks_1_id").should("have.value", "[blank-2]");
      cy.getIframeBody().find("#root_blanks_1_id").should("have.attr", "readonly");
      cy.getIframeBody().find("#root_blanks_1_size").should("have.value", "20");
      cy.getIframeBody().find("#root_blanks_1_matchTerm").should("have.value", "test match term");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt with [blank-1]");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).eql("Test prompt with [blank-1]");
        expect(state.blanks.length).eql(1);
      });

      cy.getIframeBody().find("#root_hint").type("Hint");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("Hint");
      });

      cy.getIframeBody().find("#root_blanks_0_size").clear().type("15");
      getAndClearLastPhoneMessage(state => {
        expect(state.blanks[0].size).eql(15);
      });
    });
  });

  context("Report view", () => {
    it("renders prompt and response and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          version: 1,
          prompt: "Test prompt with [blank-1] and [blank-2]",
          blanks: [
            {id: "[blank-1]", size: 10},
            {id: "[blank-2]", size: 20},
          ]
        },
        interactiveState: {
          blanks: [
            {id: "[blank-1]", response: "Test response"}
          ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt with ");

      cy.getIframeBody().find("input").eq(0).should("have.value", "Test response");
      cy.getIframeBody().find("input").eq(0).type("New answer", { force: true });
      cy.getIframeBody().find("input").eq(0).should("have.value", "Test response");
    });
  });
});
