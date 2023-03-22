import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import { Log } from "../labbook-logging";

import css from "./comment-field.scss";

export interface ICommentFieldProps {
  title: string,
  comment: string,
  setComment: (comment:string) => void,
  empty: boolean;
  readOnly: boolean;
}

const kLogCommentWaitTimeout = 10 * 1000;  // 10 seconds

export const CommentField = (props: ICommentFieldProps) => {
  const {title, comment, empty, setComment, readOnly } = props;
  const placeholder = comment
    ? comment
    : "Add comment … "; // TODO: I18n
  const [logCommentChanged, setLogCommentChanged] = useState(false);

  const logCommentChange = useCallback(() => {
    if (logCommentChanged) {
      Log({action: "comment updated", data: {comment}});
      setLogCommentChanged(false);
    }
  }, [logCommentChanged, comment]);

  // Log a text change after a timeout when it changes, unless it has already been logged by the blur event
  // on the textarea.  This handles the user typing in a comment and then never leaving the field.
  useEffect(() => {
    const timer = setTimeout(() => logCommentChange(), kLogCommentWaitTimeout);
    return () => clearTimeout(timer);
  }, [logCommentChange]);

  const handleTextAreaChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setComment(text);
    setLogCommentChanged(text !== comment);
  }, [comment, setComment]);

  return (
      <div className={css["comment-field"]} data-testid="comment-field">
        <ThumbnailTitle title={title} empty={empty}/>
        {readOnly ? <div className={css["comment-field-text"]} data-testid="comment-field-text">{comment.length === 0 ? <em>No comment.</em> : comment}</div> : null}
        {!readOnly ? <textarea disabled={empty} placeholder={placeholder} value={comment} onChange={handleTextAreaChange} onBlur={logCommentChange} data-testid="comment-field-textarea"></textarea> : null}
      </div>
  );
};


