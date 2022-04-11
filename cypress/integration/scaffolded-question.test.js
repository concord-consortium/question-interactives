import { phonePost, phoneListen, getAndClearLastPhoneMessage, getAndClearAllPhoneMessage } from "../support";

context("Test scaffolded question interactive", () => {
  let i = 0;

  beforeEach(() => {
    if (i++ > 0) cy.wait(4000);
    cy.visit("/wrapper.html?iframe=/scaffolded-question");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state (sending it to subquestions)", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
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
              answerType: "open_response_answer",
              answerText: "Subquestion response"
            }
          }
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage(hint => {
        expect(hint).eql({ text: "Hint" });
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
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
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
          answerType: "interactive_state",
          subinteractiveStates: {
            int1: {
              answerType: "open_response_answer",
              answerText: "Test subquestion answer"
            }
          },
          answerText: "[Level: 1] Test subquestion answer"
        });
      });
    });

    it("logs events from subinteractives to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt",
                hint: "Subquestion hint",
                questionType: "open_response"
              }
            }
          ]
        }
      });
      phoneListen("log");

      cy.getNestedIframeBody().find("textarea").type("Test subquestion answer");
      cy.wait(500);
      cy.focused().blur();
      cy.wait(400);
      getAndClearAllPhoneMessage((messages) => {
        expect(messages.length).eql(2);

        expect(messages[0]).eql({
          action: "focus in",
          data: {
            target_element: 'textarea',
            target_type: 'textarea',
            target_id: '',
            target_name: '',
            target_value: '',
            scaffolded_question_level: 1,
            subinteractive_url: cy.config().baseUrl + "/open-response/",
            subinteractive_type: "open_response",
            subinteractive_sub_type: undefined,
            subinteractive_id: 'int1'
          }
        });

        expect(messages[1]).eql({
          action: "focus out",
          data: {
            target_element: 'textarea',
            target_type: 'textarea',
            target_id: '',
            target_name: '',
            target_value: 'Test subquestion answer',
            scaffolded_question_level: 1,
            subinteractive_url: cy.config().baseUrl + "/open-response/",
            subinteractive_type: 'open_response',
            subinteractive_sub_type: undefined,
            subinteractive_id: 'int1',
            answer_text: 'Test subquestion answer'
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
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
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

      cy.getIframeBody().find("#root_prompt").should("include.text", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("include.text", "Hint");

      cy.getIframeBody().find("[data-cy=subquestion-authoring]").click();

      cy.getNestedIframeBody().find("#root_prompt").should("include.text", "Subquestion prompt");
      cy.getNestedIframeBody().find("#root_hint").should("include.text", "Subquestion hint");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(2);
        expect(state.prompt).include("Test prompt");
      }, 200);

      cy.getIframeBody().find("#root_hint").type("Hint");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).include("Hint");
      }, 200);

      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("[data-cy=select-subquestion]").select("Open response");
      cy.getIframeBody().find("[data-cy=subquestion-authoring]").click();

      cy.getNestedIframeBody().find("#root_prompt").type("Test subquestion prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.subinteractives[0].authoredState.prompt).include("Test subquestion prompt");
      }, 200);
    });

    // This tests specifically a bug that was present and it's pretty subtle.
    // https://www.pivotaltracker.com/story/show/173015286
    it("handles reordering of subinteractives without any state loss", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
              authoredState: {
                version: 1,
                prompt: "1"
              }
            },
            {
              id: "int2",
              libraryInteractiveId: "open-response",
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
      cy.wait(1000);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").clear();
      cy.wait(200);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").type("x");

      // 3. Move it up
      cy.wait(200);
      cy.getIframeBody().find(".array-item-move-up:not(:disabled)").click();

      // 4. Move it down
      cy.wait(200);
      cy.getIframeBody().find(".array-item-move-down:not(:disabled)").click();
      cy.wait(200);
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").should("include.text", "x");
    });
  });

  context("Report view", () => {
    it("renders prompt and response and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              libraryInteractiveId: "open-response",
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
              answerType: "open_response_answer",
              answerText: "Subquestion response"
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
