import React from "react";
import classNames from "classnames";
import css from "./thumbnail-title.scss";

interface IProps {
  title?: string;
  empty?: boolean;
  className?: string;
}

export const ThumbnailTitle: React.FC<IProps> = ({ title, empty, className }) => {
  let finalClassName = classNames([css["thumbnail-title"]], {[css.empty]: empty });
  if (className) {
    // Custom class name provided by parent component.
    finalClassName += ` ${className}`;
  }
  return (
    <div className={finalClassName} data-testid="thumbnail-title">
        {title}
    </div>
  );

};
