import React from "react";
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
  console.log("wideThumbnail", wideThumbnail);
  return (
    <div className={`${css["thumbnail"]} ${wideThumbnail && css["wide"]}`} data-testid="thumbnail">
      {thumbContent}
    </div>
  );
};
