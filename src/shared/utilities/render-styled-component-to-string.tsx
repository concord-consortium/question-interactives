import * as React from "react";
import * as Renderer from "react-dom/server";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export const renderStyledComponentToString = (component: JSX.Element, extraContent = "") => {
  const sheet = new ServerStyleSheet();
  let results = "";
  try {
    const html = Renderer.renderToStaticMarkup(
      <StyleSheetManager sheet={sheet.instance}>
        { component }
      </StyleSheetManager>
    );
    const styleTags = sheet.getStyleTags();
    results = results.concat(styleTags).concat(html).concat(extraContent);
  } catch (error) {
    console.error(error);
  } finally {
    sheet.seal();
  }
  return results;
};
