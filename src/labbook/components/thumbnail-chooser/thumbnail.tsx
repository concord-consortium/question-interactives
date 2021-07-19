import React from "react";
import "./thumbnail.scss";

export type ThumbnailModelID = string;

export interface IThumbnailProps {
  id: ThumbnailModelID;
  empty: boolean;
  label?: string;
  thumbContent?: React.FC|string;
  data: any;  // TODO: This is fine for now, type it later.
  onClick?: ()=> void;
}

export const Thumbnail: React.FC<IThumbnailProps> = (props:IThumbnailProps) => {
  const {thumbContent} = props;
  return (
    <div className="thumbnail" data-testid="thumbnail">
      {thumbContent}
    </div>
  );
};
