import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test open response interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/scaffolded-question");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state (sending it to subquestions)", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt",
                hint: "Subquestion hint"
              }
            }
          ]
        },
        interactiveState: {
          currentSubinteractiveId: "int1",
          subinteractiveStates: {
            int1: {
              response: "Subquestion response"
            }
          }
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage(hint => {
        expect(hint).eql("Hint");
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "Subquestion hint");

      cy.getNestedIframeBody().find("#app").should("include.text", "Subquestion prompt");
      cy.getNestedIframeBody().find("textarea").should("have.value", "Subquestion response");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt",
                hint: "Subquestion hint"
              }
            }
          ]
        }
      });
      phoneListen("interactiveState");

      cy.getNestedIframeBody().find("textarea").type("Test subquestion answer");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({
          subinteractiveStates: {
            int1: {
              response: "Test subquestion answer"
            }
          }
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
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt",
                hint: "Subquestion hint"
              }
            }
          ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("have.value", "Hint");

      cy.getIframeBody().find("[data-cy=subquestion-authoring]").click();

      cy.getNestedIframeBody().find("#root_prompt").should("include.text", "Subquestion prompt");
      cy.getNestedIframeBody().find("#root_hint").should("have.value", "Subquestion hint");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt", { force: true });
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).eql("Test prompt");
      });

      cy.getIframeBody().find("#root_hint").type("Hint", { force: true });
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("Hint");
      });

      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("[data-cy=select-subquestion]").select("Open response");
      cy.getIframeBody().find("[data-cy=subquestion-authoring]").click();

      cy.getNestedIframeBody().find("#root_prompt").type("Test subquestion prompt");

      getAndClearLastPhoneMessage(state => {
        expect(state.subinteractives[0].authoredState.prompt).eql("Test subquestion prompt");
      });
    });

    // This tests specifically a bug that was present and it's pretty subtle.
    // https://www.pivotaltracker.com/story/show/173015286
    it("handles reordering of subinteractives without any state loss", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "1"
              }
            },
            {
              id: "int2",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "2",
              }
            }
          ]
        }
      });

      // Lots of cy.wait as this test seems to fail sometimes.
      // 1. Open subauthoring.
      cy.wait(200);
      cy.getIframeBody().find("[data-cy=subquestion-authoring]").eq(0).click();
      cy.wait(200);
      cy.getIframeBody().find("[data-cy=subquestion-authoring]").eq(1).click();

      // 2. Edit second question.
      cy.wait(200);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").clear();
      cy.wait(200);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").type("x", { force: true });

      // 3. Move it up
      cy.wait(200);
      cy.getIframeBody().find(".array-item-move-up:not(:disabled)").click();

      // 4. Move it down
      cy.wait(200);
      cy.getIframeBody().find(".array-item-move-down:not(:disabled)").click();
      cy.wait(200);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").should("have.value", "x");
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
          subinteractives: [
            {
              id: "int1",
              url: "/open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt",
                hint: "Subquestion hint"
              }
            }
          ]
        },
        interactiveState: {
          currentSubinteractiveId: "int1",
          subinteractiveStates: {
            int1: {
              response: "Subquestion response"
            }
          }
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getNestedIframeBody().find("textarea").should("have.value", "Subquestion response");

      cy.getNestedIframeBody().find("textarea").type("New answer", { force: true });

      cy.getNestedIframeBody().find("textarea").should("have.value", "Subquestion response");
    });
  });
});
