import { phonePost, phoneListen, getAndClearLastPhoneMessage, getAndClearAllPhoneMessage } from "../support";

context("Test carousel interactive", () => {
  let i = 0;

  beforeEach(() => {
    if (i++ > 0) cy.wait(4000);
    cy.visit("/wrapper.html?iframe=/carousel");
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
              url: "open-response",
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
              url: "open-response",
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
          answerText: "Test subquestion answer"
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
              url: "open-response",
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
      cy.focused().blur();
      cy.wait(200);

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
            subinteractive_url: "open-response",
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
            subinteractive_url: "open-response",
            subinteractive_type: 'open_response',
            subinteractive_sub_type: undefined,
            subinteractive_id: 'int1',
            answer_text: 'Test subquestion answer'
          }
        });
      });
    });

    it("renders slides and nav buttons that move corresponding slides into view)", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #1",
                hint: ""
              }
            },
            {
              id: "int2",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #2",
                hint: ""
              }
            },
            {
              id: "int3",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #3",
                hint: ""
              }
            }
          ]
        }
      });

      cy.getIframeBody().find(".slide").should('have.length', 3);
      cy.getIframeBody().find(".slide").eq(0).find("iframe").its("0.contentDocument.body").should("include.text", "Subquestion prompt #1");
      cy.getIframeBody().find(".slide").eq(1).find("iframe").its("0.contentDocument.body").should("include.text", "Subquestion prompt #2");
      cy.getIframeBody().find(".slide").eq(2).find("iframe").its("0.contentDocument.body").should("include.text", "Subquestion prompt #3");
      cy.getIframeBody().find(".slider").eq(0).should("have.attr", "style").should("contain", "translate3d(0px, 0px, 0px)");
      cy.getIframeBody().find(".slide").eq(0).should("have.class", "selected");
      // note: nav button index numbers don't match slide index numbers because of the previous and next buttons in navbar
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(2).should("exist").click();
      cy.getIframeBody().find(".slider").eq(0).should("have.attr", "style").should("contain", "translate3d(-100%, 0px, 0px)");
      cy.getIframeBody().find(".slide").eq(0).should("not.have.class", "selected");
      cy.getIframeBody().find(".slide").eq(1).should("have.class", "selected");
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(3).should("exist").click();
      cy.getIframeBody().find(".slider").eq(0).should("have.attr", "style").should("contain", "translate3d(-200%, 0px, 0px)");
      cy.getIframeBody().find(".slide").eq(1).should("not.have.class", "selected");
      cy.getIframeBody().find(".slide").eq(2).should("have.class", "selected");
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(0).should("exist").click();
      cy.getIframeBody().find(".slider").eq(0).should("have.attr", "style").should("contain", "translate3d(-100%, 0px, 0px)");
      cy.getIframeBody().find(".slide").eq(2).should("not.have.class", "selected");
      cy.getIframeBody().find(".slide").eq(1).should("have.class", "selected");
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(4).should("exist").click();
      cy.getIframeBody().find(".slider").eq(0).should("have.attr", "style").should("contain", "translate3d(-200%, 0px, 0px)");
      cy.getIframeBody().find(".slide").eq(1).should("not.have.class", "selected");
      cy.getIframeBody().find(".slide").eq(2).should("have.class", "selected");
    });

    it("renders nav buttons with custom images)", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 2,
          prompt: "Test prompt",
          hint: "Hint",
          subinteractives: [
            {
              id: "int1",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #1",
                hint: ""
              },
              navImageUrl: "http://fake.domain/path/to/image1.png",
              navImageAltText: "Custom Image 1"
            },
            {
              id: "int2",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #2",
                hint: ""
              },
              navImageUrl: "http://fake.domain/path/to/image2.png",
              navImageAltText: "Custom Image 2"
            },
            {
              id: "int3",
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "Subquestion prompt #3",
                hint: ""
              },
              navImageUrl: "http://fake.domain/path/to/image3.png",
              navImageAltText: ""
            }
          ]
        }
      });

      // note: nav button count should be two more than slide count because of previous and next buttons
      cy.getIframeBody().find(".slide").should('have.length', 3);
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").should('have.length', 5);
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(1).should("have.css", "backgroundImage", 'url("http://fake.domain/path/to/image1.png")');
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(1).should("include.text", "Custom Image 1");
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(2).should("have.css", "backgroundImage", 'url("http://fake.domain/path/to/image2.png")');
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(2).should("include.text", "Custom Image 2");
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(3).should("have.css", "backgroundImage", 'url("http://fake.domain/path/to/image3.png")');
      cy.getIframeBody().find("[data-cy='carousel-nav']").children("button").eq(3).should("include.text", "Go to slide 3");
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
              url: "open-response",
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
        expect(state.version).eql(1);
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
              url: "open-response",
              authoredState: {
                version: 1,
                prompt: "1"
              }
            },
            {
              id: "int2",
              url: "open-response",
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
      cy.getNestedIframeBody("iframe", "#int2").find("#root_prompt").clear({ force: true });
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
});
