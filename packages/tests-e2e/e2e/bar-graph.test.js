import {phonePost, phoneListen, getAndClearAllPhoneMessage, getAndClearLastPhoneMessage} from "../support/e2e";

export const DemoAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>Can you <strong>estimate</strong> the amount of Spring and Summer sunlight?</p>",
  hint: "The amount Spring and Summer sunlight will be larger than Winter and Fall",
  title: "Estimate Amount of Spring and Summer Sunlight",
  xAxisLabel: "Seasons",
  yAxisLabel: "Days of Sunlight",
  yAxisOrientation: "horizontal",
  maxYValue: 100,
  yAxisCountBy: 10,
  showValuesAboveBars: true,
  numberOfDecimalPlaces: 0,
  bars: [
    { label: "Winter", value: 25, lockValue: true, color: "#EA6D2F" },
    { label: "Spring", value: 0, lockValue: false, color: "#FFC320" },
    { label: "Summer", value: 75, lockValue: false, color: "#2DA343" },
    { label: "Fall", value: 50, lockValue: true, color: "#6FC6DA" }
  ]
};

const pressKeyAndCheckValue = (index, key, value) => {
  cy.getIframeBody().find(`[data-cy="slider${index}"]`)
    .trigger("keydown", {key})
    .invoke("attr", "aria-valuenow").should("eq", String(value));
};

const dragDropMouseAndCheckValue = (index, clientY, value) => {
  cy.getIframeBody().find(`[data-cy="slider${index}"]`)
    .trigger('mousedown')
    .trigger('mousemove', {clientX: 0, clientY})
    .trigger('mouseup')
    .invoke("attr", "aria-valuenow").should("eq", String(value));
};

context("Test bar graph interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/bar-graph");
  });

  context("Runtime view", () => {
    it("renders empty bar graph if there's no data available", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1
        }
      });
      cy.getIframeBody().find("canvas").should("have.length", 1);
    });

    it("renders a bar graph with the demo data", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: DemoAuthoredState
      });
      cy.getIframeBody().find("canvas").should("have.length", 1);
      cy.getIframeBody().find('[data-cy="xAxisLabel"]').should("contain", DemoAuthoredState.xAxisLabel);
      cy.getIframeBody().find('[data-cy="yAxisLabel"]').should("contain", DemoAuthoredState.yAxisLabel);
      cy.getIframeBody().find('[data-cy="title"]').should("contain", DemoAuthoredState.title);
      cy.getIframeBody().find('[data-cy="barValues"]').should("have.length", 1);

      DemoAuthoredState.bars.forEach((bar, index) => {
        cy.getIframeBody().find(`[data-cy="barValue${index}"]`).should("contain", DemoAuthoredState.bars[index].value);

        if (bar.lockValue) {
          // locked bars don't have sliders
          cy.getIframeBody().find(`[data-cy="slider${index}"]`).should("not.exist");
        } else {
          // check the aria settings
          cy.getIframeBody().find(`[data-cy="slider${index}"]`).invoke("attr", "role").should("eq", "slider");
          cy.getIframeBody().find(`[data-cy="slider${index}"]`).invoke("attr", "aria-valuemin").should("eq", "0");
          cy.getIframeBody().find(`[data-cy="slider${index}"]`).invoke("attr", "aria-valuemax").should("eq", String(DemoAuthoredState.maxYValue));
          cy.getIframeBody().find(`[data-cy="slider${index}"]`).invoke("attr", "aria-valuenow").should("eq", String(bar.value));

          // check keyboard input
          pressKeyAndCheckValue(index, "ArrowUp", bar.value + 1);
          pressKeyAndCheckValue(index, "ArrowUp", bar.value + 2);
          pressKeyAndCheckValue(index, "ArrowDown", bar.value + 1);
          pressKeyAndCheckValue(index, "ArrowDown", bar.value);
          pressKeyAndCheckValue(index, "ArrowDown", Math.max(0, bar.value - 1));
          pressKeyAndCheckValue(index, "End", DemoAuthoredState.maxYValue);
          pressKeyAndCheckValue(index, "Home", 0);
          pressKeyAndCheckValue(index, "PageUp", 10);
          pressKeyAndCheckValue(index, "PageUp", 20);
          pressKeyAndCheckValue(index, "PageDown", 10);
          pressKeyAndCheckValue(index, "PageDown", 0);

          // check mouse input (numeric values are clientY values)
          dragDropMouseAndCheckValue(index, 0, "100");
          dragDropMouseAndCheckValue(index, 110, "100");
          dragDropMouseAndCheckValue(index, 120, "99");
          dragDropMouseAndCheckValue(index, 150, "91");
          dragDropMouseAndCheckValue(index, 200, "76");
          dragDropMouseAndCheckValue(index, 300, "47");
          dragDropMouseAndCheckValue(index, 400, "18");
          dragDropMouseAndCheckValue(index, 460, "1");
          dragDropMouseAndCheckValue(index, 480, "0");
          dragDropMouseAndCheckValue(index, 600, "0");
        }
      });
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: DemoAuthoredState,
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");
      cy.getIframeBody().find("#app").should("include.text", "Graph Title");
      cy.getIframeBody().find("#app").should("include.text", "X-axis Label");
      cy.getIframeBody().find("#app").should("include.text", "Y-axis Label");
      cy.getIframeBody().find("#app").should("include.text", "Y-axis Text Orientation");
      cy.getIframeBody().find("#app").should("include.text", "Y-axis Max Value");
      cy.getIframeBody().find("#app").should("include.text", "Y-axis Tick Spacing");
      cy.getIframeBody().find("#app").should("include.text", "Show values above bars");
      cy.getIframeBody().find("#app").should("include.text", "Number of Decimal Places");

      DemoAuthoredState.bars.forEach((bar, index) => {
        cy.getIframeBody().find(`#root_bars_${index}_label`).should("have.value", DemoAuthoredState.bars[index].label);
        cy.getIframeBody().find(`#root_bars_${index}_value`).should("have.value", DemoAuthoredState.bars[index].value);
        cy.getIframeBody().find(`#root_bars_${index}_lockValue`).should(DemoAuthoredState.bars[index].lockValue ? "be.checked" : "not.be.checked");
        cy.getIframeBody().find(`#root_bars_${index}_color`).should("have.value", DemoAuthoredState.bars[index].color.toLowerCase());
      })
    });
  });
});
