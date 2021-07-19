import React from "react";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import { IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import css from "./comment-field.scss";


export interface ICommentFieldProps {
  item?: IThumbnailProps;
}

export const CommentField: React.FC<ICommentFieldProps> = (props) => {
  const {item} = props;
  const empty = item ? item.empty : true;
  const placeholder = empty
    ? ""
    : "Add comment … "; // TODO: I18n

  return (
      <div className={css["comment-field"]}>
        <ThumbnailTitle title={item?.id} empty={empty}/>
        <textarea disabled={empty} placeholder={placeholder}>
        </textarea>
      </div>
  );
};


