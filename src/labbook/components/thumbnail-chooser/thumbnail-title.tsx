import React from "react";
import classNames from "classnames";
import "./thumbnail-title.scss";

interface IProps {
  title?: string;
  empty: boolean;
}

export const ThumbnailTitle: React.FC<IProps> = ({ title, empty }) => {
  const className = classNames("thumbnail-title", {empty});
  return (
    <div className={className} data-testid="thumbnail-title">
        {title}
    </div>
  );

};
