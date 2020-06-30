// Taken from https://www.cypress.io/blog/2020/02/12/working-with-iframes-in-cypress/
Cypress.Commands.add('getIframeBody', (iframeSelector = 'iframe') => {
  // get the iframe > document > body
  // and retry until the body element is not empty
  return cy
    .get(iframeSelector)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    // wraps "body" DOM element to allow
    // chaining more Cypress commands, like ".find(...)"
    // https://on.cypress.io/wrap
    .then(cy.wrap)
});

// We can't just chain getIframeBody twice. It seems that for nested fire, it's necessary to use `find`, not `get`.
// Based on this issue/comment: https://github.com/cypress-io/cypress/issues/136#issuecomment-619240781
Cypress.Commands.add('getNestedIframeBody', (parentIframeSelector = 'iframe', nestedIframeSelector = 'iframe') => {
  return cy.getIframeBody(parentIframeSelector)
    .find(nestedIframeSelector)
    .its('0.contentDocument.body').should('not.be.empty')
    // wraps "body" DOM element to allow
    // chaining more Cypress commands, like ".find(...)"
    // https://on.cypress.io/wrap
    .then(cy.wrap)
});

// Iframe-phone helpers. Note that iframe-phone is exported to window.phone variable in wrapper page (check wrapper.tsx).
export const useIframePhone = (callback) => {
  cy.window().should("have.property", "phone");
  cy.window().then(window => {
    callback(window.phone);
  });
};

export const phonePost = (type, message) => {
  useIframePhone(phone =>
    phone.post(type, message)
  );
};

export const phoneListen = (type) => {
  useIframePhone(phone => {
    cy.window().then(window => {
      phone.addListener(type, newState => {
        window.receivedMessage = newState;
        if (!window.receivedMessages) {
          window.receivedMessages = [];
        }
        window.receivedMessages.push(newState);
      });
    });
  });
};

export const getAndClearLastPhoneMessage = (callback) => {
  // This will wait until window.receivedMessage is defined.
  cy.window().should("have.property", "receivedMessage");
  cy.window().then(window => {
    callback(window.receivedMessage);
    // Important - clear message so when getAndClearLastPhoneMessage is called again, it can wait for a new one
    // (using cy.window().should("have.property", "receivedMessage") call above) instead of returning stale message.
    delete window.receivedMessage;
    delete window.receivedMessages;
  });
};

export const getAndClearAllPhoneMessage = (callback) => {
  // This will wait until window.receivedMessages is defined.
  cy.window().should("have.property", "receivedMessages");
  cy.window().then(window => {
    callback(window.receivedMessages);
    // Important - clear message so when getAndClearAllPhoneMessage is called again, it can wait for a new one
    // (using cy.window().should("have.property", "receivedMessages") call above) instead of returning stale message.
    delete window.receivedMessage;
    delete window.receivedMessages;
  });
};
