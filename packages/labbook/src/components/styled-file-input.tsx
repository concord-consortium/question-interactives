import React, { useRef } from "react";
import css from "./styled-file-input.scss";
import classNames from "classnames";

export interface IStyledFileInputProps {
  onChange: (fileOrUrl: File | undefined) => void;
  buttonClass: string;
  id?: string;
  selectNextItem?: () => void;
}

/*
 * By default file inputs don't look good. This is an attempt to allow for
 * some styling while still addressing accessability concerns.
 * See:
 * - https://stackoverflow.com/questions/572768/styling-an-input-type-file-button
 * - http://jsfiddle.net/4cwpLvae/
 * - https://webaim.org/techniques/css/invisiblecontent/
 */
export const StyledFileInput: React.FC<IStyledFileInputProps> = (props) => {
  const {children, onChange, buttonClass, id} = props;
  const classes = classNames(buttonClass);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Reset current file input value as soon as user clicks on the button. Otherwise, user won't be able to upload
    // the same file again. This is necessary in Labbook after user deletes the current thumbnail, and might be
    // generally useful in other scenarios. See: https://www.pivotaltracker.com/story/show/183721375
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onChange?.(file);
  };

  return (
    <>
      <label
        htmlFor={`file-upload-${id}`}
        className={classes}
        data-testid="upload-btn">
          {children}
      </label>
      <input ref={fileInputRef} className={css.hidden} id={`file-upload-${id}`} type="file" onClick={handleClick} onChange={handleChange}/>
    </>
  );
};
