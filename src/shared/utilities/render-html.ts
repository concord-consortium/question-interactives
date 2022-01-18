import DOMPurify from "dompurify";
import parse from "html-react-parser";

// from module htmlparser2
interface DomElement {
    attribs?: {[s: string]: string};
    children?: DomElement[];
    data?: any;
    name?: string;
    next?: DomElement;
    parent?: DomElement;
    prev?: DomElement;
    type?: string;
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type ParseHTMLReplacer = (domNode: DomElement) => JSX.Element | object | void | undefined | null | false;

DOMPurify.setConfig({ ADD_ATTR: ['target'] });
export function renderHTML(html: string, replace?: ParseHTMLReplacer) {
  let newHtml;
  if (html.includes("<a")) {
    const position = html.indexOf("<a") + 2;
    newHtml = [html.slice(0, position), " target=\"_blank\"", html.slice(position)].join("");
  } else {
    newHtml = html;
  }
  return parse(DOMPurify.sanitize(newHtml || ""), { replace });
}
