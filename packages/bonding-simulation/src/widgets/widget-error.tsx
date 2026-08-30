import React from "react";

import css from "./widget-error.scss";

interface IWidgetErrorProps {
  message: string;
}

export function WidgetError({ message }: IWidgetErrorProps) {
  return <div className={css.widgetError}>{message}</div>;
}
