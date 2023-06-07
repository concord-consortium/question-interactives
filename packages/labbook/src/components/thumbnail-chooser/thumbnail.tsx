import React from "react";
import classnames from "classnames";
import css from "./thumbnail.scss";

export type ThumbnailModelID = string;

export interface IThumbnailProps {
  id: ThumbnailModelID;
  empty: boolean;
  label?: string;
  thumbContent?: React.ReactNode;
  data: any;
  onClick?: ()=> void;
  wideThumbnail?: boolean;
}

export const Thumbnail: React.FC<IThumbnailProps> = (props:IThumbnailProps) => {
  const {thumbContent, wideThumbnail} = props;
  return (
    <div className={classnames(css["thumbnail"], {[css.wide]: wideThumbnail})} data-testid="thumbnail">
      {thumbContent}
    </div>
  );
};
