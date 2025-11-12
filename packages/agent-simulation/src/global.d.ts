declare module "*.scss";
declare module "*.svg" {
  import React from "react";
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default content;
}
declare module "shutterbug";
declare module "iframe-phone";
