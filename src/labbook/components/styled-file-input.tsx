import React from "react";
import css from "./styled-file-input.scss";
import classNames from "classnames";

export interface IStyledFileInputProps {
  onChange: (fileOrUrl: File | undefined) => void;
  buttonClass: string;
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
  const {children, onChange, buttonClass} = props;
  const classes = classNames(buttonClass);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.dir(file);
    onChange?.(file);
  };

  return (
    <>
      <label
        htmlFor="file-upload"
        className={classes}
        data-test="upload-btn">
          {children}
      </label>
      <input className={css.hidden} id="file-upload" type="file" onChange={handleChange}/>
    </>
  );
};
