import React from "react";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import css from "./comment-field.scss";


export interface ICommentFieldProps {
  title: string,
  comment: string,
  setComment: (comment:string) => void,
  empty: boolean;
}

export const CommentField: React.FC<ICommentFieldProps> = (props) => {
  const {title, comment, empty } = props;
  const placeholder = comment
    ? comment
    : "Add comment … "; // TODO: I18n

  return (
      <div className={css["comment-field"]}>
        <ThumbnailTitle title={title} empty={empty}/>
        <textarea disabled={empty} placeholder={placeholder}>
        </textarea>
      </div>
  );
};


