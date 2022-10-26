export const getThumbnailWrapper = () => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]");
}
export const getThumbnailButton = (index) => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]:nth-child(" + index + ") [data-testid=thumbnail-button]");
}

export const getThumbnailTitle = (index) => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]:nth-child(" + index + ") [data-testid=thumbnail-title]");
}

export const getThumbnail = (index) => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]:nth-child(" + index + ") [data-testid=thumbnail]")
}

export const getThumbnailPlusButton = (index) => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]:nth-child(" + index + ") [data-testid=thumbnail-plus-button]")
}

export const getThumbnailClose = (index) => {
    return cy.getIframeBody().find("[data-testid=thumbnail-wrapper]:nth-child(" + index + ") [data-testid=thumbnail-close-button]");
}

export const getPreviousArrow = () => {
    return cy.getIframeBody().find("[data-testid=previous-arrow]");
}

export const getNextArrow = () => {
    return cy.getIframeBody().find("[data-testid=next-arrow]");
}

export const getUploadButton = () => {
    return cy.getIframeBody().find("[data-testid=upload-btn]");
}

export const getCommentsTextArea = () => {
    return cy.getIframeBody().find("[data-testid=comment-field-textarea]");
}

export const getDrawTool = () => {
    return cy.getIframeBody().find("[data-testid=draw-tool]");
}

export const getDrawToolPalette = () => {
    return cy.getIframeBody().find("[data-testid=draw-tool] .dt-tools");
}

export const getPlatteButton = (index) => {
    return cy.getIframeBody().find("[data-testid=draw-tool] .dt-palette.dt-vertical .dt-btn:nth-child(" + index + ")");
}

export const drawOnCanvas = () => {
    cy.getIframeBody().find("[data-testid=draw-tool] .dt-canvas-container .upper-canvas")
        .trigger('mousedown', 300, 200, { force: true })
        .trigger('mousemove', 320, 220, { force: true })
        .trigger('mouseup', { force: true });
    cy.wait(500);
}

export const getDrawToolCanvas = () => {
    return cy.getIframeBody().find("[data-testid=draw-tool] .dt-canvas-container.with-border");
}

export const getDrawToolThumbnailTitle = () => {
    return cy.getIframeBody().find("[data-testid=draw-tool] [data-testid=thumbnail-title]");
}

export const getCommentsFieldThumbnailTitle = () => {
    return cy.getIframeBody().find("[data-testid=comment-field] [data-testid=thumbnail-title]");
}
