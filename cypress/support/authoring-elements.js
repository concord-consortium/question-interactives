export const getAuthoringView = () => {
    return cy.getIframeBody().find("#app");
}

export const getPrompt = () => {
    return cy.getIframeBody().find("#root_prompt");
}

export const getHint = () => {
    return cy.getIframeBody().find("#root_hint");
}

export const getImageFit = (imageFit) => {
    return cy.getIframeBody().find("#root_imageFit input[value=" + imageFit + "]");
}

export const getImagePosition = (imagePosition) => {
    return cy.getIframeBody().find("#root_imagePosition input[value=" + imagePosition + "]");
}

export const getSnapshotTarget = () => {
    return cy.getIframeBody().find("#root_snapshotTarget");
}

export const getShowUploadImage = () => {
    return cy.getIframeBody().find("#root_showUploadImageButton");
}

export const getMaxItems = () => {
    return cy.getIframeBody().find("#root_maxItems");
}

export const getShowItems = () => {
    return cy.getIframeBody().find("#root_showItems");
}
