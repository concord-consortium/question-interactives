import React, { ChangeEvent } from "react";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import css from "./comment-field.scss";


export interface ICommentFieldProps {
  title: string,
  comment: string,
  setComment: (comment:string) => void,
  empty: boolean;
}



export const CommentField: React.FC<ICommentFieldProps> = (props) => {
  const {title, comment, empty, setComment } = props;
  const placeholder = comment
    ? comment
    : "Add comment … "; // TODO: I18n

  const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setComment(text);
  };

  return (
      <div className={css["comment-field"]}>
        <ThumbnailTitle title={title} empty={empty}/>
        <textarea disabled={empty} placeholder={placeholder} value={comment} onChange={handleTextAreaChange}>
        </textarea>
      </div>
  );
};


