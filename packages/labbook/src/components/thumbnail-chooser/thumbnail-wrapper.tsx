import React from "react";
import classNames from "classnames";
import { ThumbnailTitle } from "./thumbnail-title";
import { IThumbnailProps, Thumbnail } from "./thumbnail";
import t from "../../utils/translation/translate";
import css from "./thumbnail-wrapper.scss";
export interface IThumbnailWrapperProps {
  selected: boolean;
  setSelectedContainerId: (id:string) => void;
  clearContainer: (id:string) => void;
  content: IThumbnailProps;
  readOnly: boolean;
  wideThumbnail?: boolean;
  uploadPreviewMode?: boolean;
  showNewTextOverride?: boolean;
  inDialog?: boolean;
}

export const ThumbnailWrapper: React.FC<IThumbnailWrapperProps> = (props) => {
  const { selected, setSelectedContainerId, clearContainer, content, readOnly, wideThumbnail, uploadPreviewMode, showNewTextOverride, inDialog} = props;
  const { onClick, empty, id, label } = content;
  const thumbNailProps = {...content, wideThumbnail};
  const classes = classNames(css["thumbnail-button"], {
    [css.selected]: selected,
    [css.empty]: empty && !showNewTextOverride,
    [css.wide]: wideThumbnail,
    [css.preview]: uploadPreviewMode
  });
  const containerClasses = classNames(css.container, { [css.disabled]: !selected});
  const showNewText = uploadPreviewMode ? true : readOnly ? false : true;
  const handleClose = empty
    ? () => null
    : (e: React.MouseEvent<HTMLElement>) => clearContainer(id);

  const clickHandler = () => {
    if (!uploadPreviewMode) {
      setSelectedContainerId(id);
      onClick?.();
    }
  };
  return (
    <div className={css["thumbnail-wrapper"]} data-testid="thumbnail-wrapper">
      <button className={classes}
              onClick={clickHandler}
              data-testid="thumbnail-button"
              disabled={uploadPreviewMode}
      >
        <ThumbnailTitle title={label} empty={empty}/>
        {
          (showNewTextOverride || (empty && showNewText)) &&
          <div className={classNames(css["empty-content"], {[css["in-dialog"]]: inDialog })}>
            <div className={css["plus-button"]} data-testid="thumbnail-plus-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <line x1="8" y1="0" x2="8" y2="16" strokeWidth="2.5"/>
                <line x1="0" y1="8" x2="16" y2="8" strokeWidth="2.5"/>
              </svg>
            </div>
            <div className={css["empty-label"]}>{t("THUMBNAIL_CHOOSER.NEW_MODEL")}</div>
          </div>
        }
        { !empty &&
          <div className={containerClasses}>
            <Thumbnail {...thumbNailProps}/>
          </div>
        }
      </button>
        {
          selected && !empty && !readOnly &&
          <button className={css["close"]} onClick={handleClose} data-testid="thumbnail-close-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <line x1="0" y1="0" x2="12" y2="12" strokeWidth="2.5"/>
              <line x1="12" y1="0" x2="0" y2="12" strokeWidth="2.5"/>
            </svg>
          </button>
        }
    </div>
  );
};
