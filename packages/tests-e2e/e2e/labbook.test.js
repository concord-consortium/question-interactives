import {phonePost, phoneListen, getAndClearAllPhoneMessage, getAndClearLastPhoneMessage} from "../support/e2e";
import * as le from "../support/labbook-elements";
import * as ae from "../support/authoring-elements";

export const UploadImageAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Can you run the above simulation and mark the patterns of earthquakes and volcanoes?",
  hint: "Mark the earthquakes using thumbnail A and volcanoes using thumbnail B",
  backgroundSource: "upload",
	maxItems: 12,
	showItems: 4,
	imageFit: "shrinkBackgroundToCanvas", // 1st option in the list
	imagePosition: "center", // 1st option in the list
};

export const TakeSnapshotAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "Can you run the above simulation and mark the patterns of earthquakes and volcanoes?",
  hint: "Mark the earthquakes using thumbnail A and volcanoes using thumbnail B",
  backgroundSource: "snapshot",
	maxItems: 10,
	showItems: 3,
	imageFit: "shrinkBackgroundToCanvas", // 1st option in the list
	imagePosition: "center", // 1st option in the list
  showUploadImageButton: true
};

context("Test Lab book interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/labbook");
  });

  context("Runtime view", () => {
    it("renders lab book with one thumbnail if no data is available", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1
        }
      });
      le.getThumbnailWrapper().should("have.length", 1);
      le.getThumbnailButton(1).should("be.enabled");
      le.getThumbnailTitle(1).should("have.text", "A");
      le.getThumbnail(1).should("have.text", "[blank]");
      le.getThumbnailClose(1).should("be.enabled");

      le.getPreviousArrow().should("be.disabled");
      le.getNextArrow().should("be.disabled");

      le.getDrawToolCanvas().should("exist");
      le.getUploadButton().should("not.exist");
      le.getCommentsTextArea().should("be.enabled");
    });

    context("renders a lab book with the demo data", () => {
      it("check initial 4 thumbnails", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });

        le.getThumbnailWrapper().should("have.length", 4);
        le.getThumbnailButton(1).should("be.enabled");
        le.getThumbnailTitle(1).should("have.text", "A");
        le.getThumbnail(1).should("have.text", "[blank]");
        le.getThumbnailClose(1).should("be.enabled");
        le.getDrawToolThumbnailTitle().should("have.text", "A");
        le.getCommentsFieldThumbnailTitle().should("have.text", "A");

        // The titles are now shown, but hidden, for "new" thumbnails so
        // that the upload/replace dialog can show them as visible choices
        le.getThumbnailButton(2).should("have.text", "BNew");
        le.getThumbnailTitle(2).should("have.text", "B");
        le.getThumbnailTitle(2).should('not.be.visible');
        le.getThumbnailPlusButton(2).should("exist");
        le.getThumbnailClose(2).should("not.exist");

        le.getThumbnailButton(3).should("have.text", "DNew");
        le.getThumbnailTitle(3).should("have.text", "D");
        le.getThumbnailTitle(3).should('not.be.visible');
        le.getThumbnailPlusButton(3).should("exist");
        le.getThumbnailClose(3).should("not.exist");

        le.getThumbnailButton(4).should("have.text", "FNew");
        le.getThumbnailTitle(4).should("have.text", "F");
        le.getThumbnailTitle(4).should('not.be.visible');
        le.getThumbnailPlusButton(4).should("exist");
        le.getThumbnailClose(4).should("not.exist");

        le.getUploadButton().should("exist");
        le.getCommentsTextArea().should("be.enabled");
      });
      it("add new thumbnails", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnailButton(2).click();
        le.getThumbnailTitle(2).should("have.text", "B");
        le.getThumbnail(2).should("have.text", "[blank]");
        le.getThumbnailClose(2).should("be.enabled");
        le.getDrawToolThumbnailTitle().should("have.text", "B");
        le.getCommentsFieldThumbnailTitle().should("have.text", "B");

        le.getThumbnailButton(3).click();
        le.getThumbnailTitle(3).should("have.text", "C");
        le.getThumbnail(3).should("have.text", "[blank]");
        le.getThumbnailClose(3).should("be.enabled");
        le.getDrawToolThumbnailTitle().should("have.text", "C");
        le.getCommentsFieldThumbnailTitle().should("have.text", "C");

        le.getThumbnailButton(4).click();
        le.getThumbnailTitle(4).should("have.text", "D");
        le.getThumbnail(4).should("have.text", "[blank]");
        le.getThumbnailClose(4).should("be.enabled");
        le.getDrawToolThumbnailTitle().should("have.text", "D");
        le.getCommentsFieldThumbnailTitle().should("have.text", "D");
      });
      it("add a new thumbnail skipping one", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnailButton(3).click();
        le.getThumbnailTitle(2).should("have.text", "B");
        le.getThumbnail(2).should("have.text", "[blank]");
        le.getThumbnailClose(2).should("be.enabled");

        le.getThumbnailButton(4).click();
        le.getThumbnailTitle(3).should("have.text", "C");
        le.getThumbnail(3).should("have.text", "[blank]");
        le.getThumbnailClose(3).should("be.enabled");

        le.getThumbnailButton(4).click();
        le.getThumbnailTitle(4).should("have.text", "D");
        le.getThumbnail(4).should("have.text", "[blank]");
        le.getThumbnailClose(4).should("be.enabled");
      });
      it("check previous and next arrows", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnailButton(2).click();
        le.getThumbnailButton(3).click();
        le.getThumbnailButton(4).click();

        le.getPreviousArrow().should("be.disabled");
        le.getNextArrow().should("be.enabled");
        le.getNextArrow().click();

        le.getThumbnailTitle(1).should("have.text", "B");
        le.getThumbnailTitle(2).should("have.text", "C");
        le.getThumbnailTitle(3).should("have.text", "D");

        le.getThumbnailButton(4).should("have.text", "ENew");
        le.getThumbnailTitle(4).should("have.text", "E");
        le.getThumbnailTitle(4).should('not.be.visible');
        le.getThumbnailPlusButton(4).should("exist");
        le.getThumbnailClose(4).should("not.exist");

        le.getPreviousArrow().should("be.enabled");
        le.getNextArrow().should("be.disabled");
        le.getPreviousArrow().click();
        le.getPreviousArrow().should("be.disabled");
        le.getNextArrow().should("be.enabled");
      });
      it("close thumbnails", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnailButton(2).click();
        le.getThumbnailClose(2).click();

        le.getThumbnailButton(2).should("have.text", "BNew");
        le.getThumbnailTitle(2).should("have.text", "B");
        le.getThumbnailTitle(2).should('not.be.visible');
        le.getThumbnailPlusButton(2).should("exist");
        le.getThumbnailClose(2).should("not.exist");

        le.getThumbnailButton(3).click();
        le.getThumbnailClose(2).click();
        le.getThumbnailButton(2).should("have.text", "BNew");
        le.getThumbnailTitle(2).should("have.text", "B");
        le.getThumbnailTitle(2).should('not.be.visible');
        le.getThumbnailPlusButton(2).should("exist");
        le.getThumbnailClose(2).should("not.exist");
      });
      it("renders drawing tool", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getDrawTool().should("exist");
        le.getDrawToolThumbnailTitle().should("have.text", "A");
        le.getDrawToolPalette().should("exist");
        le.getDrawToolCanvas().should("exist");

        le.getThumbnailButton(2).click();
        le.getDrawTool().should("exist");
        le.getDrawToolThumbnailTitle().should("have.text", "B");
        le.getDrawToolPalette().should("exist");
        le.getDrawToolCanvas().should("exist");

        le.getThumbnailButton(1).click();
        le.getDrawTool().should("exist");
        le.getDrawToolThumbnailTitle().should("have.text", "A");
        le.getDrawToolPalette().should("exist");
        le.getDrawToolCanvas().should("exist");
      });
      it("updates thumbnail with changes to drawing tool", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnail(1).should("have.text", "[blank]");
        le.getPlatteButton(3).click();
        le.drawOnCanvas();
        le.getThumbnail(1).find(".dt-canvas-container").should("exist");
      });
      it("upload image", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: UploadImageAuthoredState
        });
        le.getThumbnail(1).should("have.text", "[blank]");
        le.getUploadButton().should("have.text", "Upload Image");
        le.getFileInput().selectFile('fixtures/image-upload.png', {force: true});
        le.getUploadButton().should("have.text", "Please Wait");
        cy.wait(4000);
        le.getThumbnail(1).find(".dt-canvas-container").should("exist");
      })
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state for Upload Image mode", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: UploadImageAuthoredState,
      });

      ae.getAuthoringView().should("include.text", "Prompt");
      ae.getAuthoringView().should("include.text", "Hint");
      ae.getPrompt().should("include.text", UploadImageAuthoredState.prompt);
      ae.getHint().should("have.value", UploadImageAuthoredState.hint);
      // New version of react-jsonschema-form doesn't set the value of the radio buttons to any descriptive value.
      // We need to rely on index.
      ae.getImageFit("0").should("be.checked");
      ae.getImagePosition("0").should("be.checked");
      ae.getShowUploadImage().should("not.exist");
      ae.getSnapshotTarget().should("not.exist");
      ae.getMaxItems().should("have.value", UploadImageAuthoredState.maxItems);
      ae.getShowItems().should("have.value", UploadImageAuthoredState.showItems);
    });
    it("handles pre-existing authored state for Snapshot mode", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: TakeSnapshotAuthoredState,
      });

      ae.getAuthoringView().should("include.text", "Prompt");
      ae.getAuthoringView().should("include.text", "Hint");
      ae.getPrompt().should("include.text", TakeSnapshotAuthoredState.prompt);
      ae.getHint().should("have.value", TakeSnapshotAuthoredState.hint);
      ae.getImageFit("0").should("be.checked");
      ae.getImagePosition("0").should("be.checked");
      ae.getShowUploadImage().should("be.checked");
      ae.getSnapshotTarget().should("exist");
      ae.getMaxItems().should("have.value", TakeSnapshotAuthoredState.maxItems);
      ae.getShowItems().should("have.value", TakeSnapshotAuthoredState.showItems);
    });
  });
});
