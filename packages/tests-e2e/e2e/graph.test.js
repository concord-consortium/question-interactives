import {phonePost, phoneListen, getAndClearAllPhoneMessage, getAndClearLastPhoneMessage} from "../support/e2e";

context("Test graph interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/graph");
  });

  context("Runtime view", () => {
    it("renders empty graph if there's no data available", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          dataSourceInteractive1: "testInt1"
        },
        linkedInteractives: [ {id: "testInt1", label: "dataSourceInteractive1"} ]
      });
      cy.getIframeBody().find("canvas").should("have.length", 1);
    });

    it("renders multiple graphs when data cannot be merged", () => {
      phoneListen("addLinkedInteractiveStateListener");

      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          graphsPerRow: 2,
          dataSourceInteractive1: "testInt1",
          dataSourceInteractive2: "testInt2"
        },
        // Note that this is necessary, see use-linked-interactives hook for implementation details.
        // Generally, labels need to match authored state properties, and IDs become values in the authored state.
        linkedInteractives: [ {id: "testInt1", label: "dataSourceInteractive1"}, {id: "testInt2", label: "dataSourceInteractive2"} ]
      });

      cy.wait(100);
      getAndClearAllPhoneMessage(messages => {
        // Two "addLinkedInteractiveStateListener" messages with listenerIds necessary to send back the response.
        expect(messages.length).to.eql(2);
        const listenerIds = messages.map(m => m.listenerId);

        // Send the first linked state.
        phonePost("linkedInteractiveState", {
          listenerId: listenerIds[0],
          interactiveState: {
            dataset: {
              type: "dataset",
              version: 1,
              properties: ["x", "y"],
              xAxisProp: "x",
              rows: [ [1, 1], [2, 2] ]
            }
          }
        });
        cy.getIframeBody().find("canvas").should("have.length", 1);

        // Now send the second state.
        phonePost("linkedInteractiveState", {
          listenerId: listenerIds[1],
          interactiveState: {
            dataset: {
              type: "dataset",
              version: 1,
              properties: ["x", "y2"], // note that y2 !== y, so two separate graphs are necessary.
              xAxisProp: "x",
              rows: [ [1, 1], [2, 2] ]
            }
          }
        });
        cy.getIframeBody().find("canvas").should("have.length", 2);
      });
    });

    it("renders one graph when data can be merged", () => {
      phoneListen("addLinkedInteractiveStateListener");

      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          graphsPerRow: 2,
          dataSourceInteractive1: "testInt1",
          dataSourceInteractive2: "testInt2"
        },
        // Note that this is necessary, see use-linked-interactives hook for implementation details.
        // Generally, labels need to match authored state properties, and IDs become values in the authored state.
        linkedInteractives: [ {id: "testInt1", label: "dataSourceInteractive1"}, {id: "testInt2", label: "dataSourceInteractive2"} ]
      });

      cy.wait(100);
      getAndClearAllPhoneMessage(messages => {
        // Two "addLinkedInteractiveStateListener" messages with listenerIds necessary to send back the response.
        expect(messages.length).to.eql(2);
        const listenerIds = messages.map(m => m.listenerId);

        const interactiveState = {
          dataset: {
            type: "dataset",
              version: 1,
              properties: ["x", "y"],
              xAxisProp: "x",
              rows: [ [1, 1], [2, 2] ]
          }
        };

        // Send the first linked state.
        phonePost("linkedInteractiveState", {
          listenerId: listenerIds[0],
          interactiveState
        });
        cy.getIframeBody().find("canvas").should("have.length", 1);

        // Now send the second state.
        phonePost("linkedInteractiveState", {
          listenerId: listenerIds[1],
          interactiveState
        });
        // Still one graph but with two bars.
        cy.getIframeBody().find("canvas").should("have.length", 1);
      });
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          graphsPerRow: 2,
          dataSourceInteractive1: "testInt1",
          dataSourceInteractive2: "testInt2"
        },
        // Note that this is necessary, see use-linked-interactives hook for implementation details.
        // Generally, labels need to match authored state properties, and IDs become values in the authored state.
        linkedInteractives: [ {id: "testInt1", label: "dataSourceInteractive1"}, {id: "testInt2", label: "dataSourceInteractive2"} ]
      });

      cy.getIframeBody().find("#app").should("include.text", "Number of graphs per row");
      cy.getIframeBody().find("#app").should("include.text", "Data Source Interactive 1");
      cy.getIframeBody().find("#app").should("include.text", "Data Source Interactive 2");
      cy.getIframeBody().find("#app").should("include.text", "Data Source Interactive 3");

      cy.getIframeBody().find("#root_graphsPerRow input[checked]").should("have.value", "2");
      cy.getIframeBody().find("#root_dataSourceInteractive1").should("have.value", "testInt1");
      cy.getIframeBody().find("#root_dataSourceInteractive2").should("have.value", "testInt2");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          graphsPerRow: 2,
          dataSourceInteractive1: "testInt1",
          dataSourceInteractive2: "testInt2"
        },
        // Note that this is necessary, see use-linked-interactives hook for implementation details.
        // Generally, labels need to match authored state properties, and IDs become values in the authored state.
        linkedInteractives: [ {id: "testInt1", label: "dataSourceInteractive1"}, {id: "testInt2", label: "dataSourceInteractive2"} ]
      });

      // We'd still like to make this work , but couldn't get it to work at the moment.
      // So instead adding the cy.wait() on line 179
      // so that the test doesn't remain flakey which it currently is.
      // phoneListen("getInteractiveList", msg => {
      //   phonePost("interactiveList", {
      //     requestId: msg.requestId,
      //     interactives: [
      //       { id: "testInt1", name: "Test Interactive 1" },
      //       { id: "testInt2", name: "Test Interactive 2" },
      //       { id: "testInt3", name: "Test Interactive 3" },
      //       { id: "testInt4", name: "Test Interactive 4" },
      //     ]
      //   });
      // });

      phoneListen("getInteractiveList");
      phoneListen("authoredState");

      cy.wait(1000);

      // The messages that are returned can have an authored state and/or an interactive list request
      // Ideally, we'd like to look for the message type which is currently not present in the receivedMessage
      getAndClearAllPhoneMessage(messages => {
        messages.forEach(msg => {
          phonePost("interactiveList", {
            requestId: msg.requestId,
            interactives: [
              { id: "testInt1", name: "Test Interactive 1" },
              { id: "testInt2", name: "Test Interactive 2" },
              { id: "testInt3", name: "Test Interactive 3" },
              { id: "testInt4", name: "Test Interactive 4" },
            ]
          });
        });
      });
      cy.getIframeBody().find("select#root_dataSourceInteractive1").select("testInt4 (Test Interactive 4)");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.dataSourceInteractive1).eql("testInt4");
      }, 300);
    });
  });
});
