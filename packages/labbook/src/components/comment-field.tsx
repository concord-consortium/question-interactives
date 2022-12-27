import React, { ChangeEvent } from "react";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import css from "./comment-field.scss";


export interface ICommentFieldProps {
  title: string,
  comment: string,
  setComment: (comment:string) => void,
  empty: boolean;
  readOnly: boolean;
}

export const CommentField: React.FC<ICommentFieldProps> = (props) => {
  const {title, comment, empty, setComment, readOnly } = props;
  const placeholder = comment
    ? comment
    : "Add comment … "; // TODO: I18n

  const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setComment(text);
  };

  return (
      <div className={css["comment-field"]} data-testid="comment-field">
        <ThumbnailTitle title={title} empty={empty}/>
        {readOnly ? <div className={css["comment-field-text"]} data-testid="comment-field-text">{comment.length === 0 ? <em>No comment.</em> : comment}</div> : null}
        {!readOnly ? <textarea disabled={empty} placeholder={placeholder} value={comment} onChange={handleTextAreaChange} data-testid="comment-field-textarea"></textarea> : null}
      </div>
  );
};


