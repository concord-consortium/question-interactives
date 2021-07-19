import React from "react";
import classNames from "classnames";
import { ThumbnailTitle } from "./thumbnail-title";
import { IThumbnailProps, Thumbnail } from "./thumbnail";
import "./thumbnail-wrapper.scss";
import t from "../../utils/translation/translate";

export interface IThumbnailWrapperProps {
  selected: boolean;
  setSelectedContainerId: (id:string) => void;
  clearContainer: (id:string) => void;
  content: IThumbnailProps;
}

export const ThumbnailWrapper: React.FC<IThumbnailWrapperProps> = (props) => {
  const { selected, setSelectedContainerId, clearContainer, content} = props;
  const { onClick, empty, id } = content;
  const classes = classNames("thumbnail-button", { selected, empty });
  const handleClose = empty
    ? () => null
    : (e: React.MouseEvent<HTMLElement>) => clearContainer(id);

  const clickHandler = () => {
    setSelectedContainerId(id);
    onClick?.();
  };
  return (
    <div className="thumbnail-wrapper" data-testid="thumbnail-wrapper">
      <button className={classes}
              onClick={clickHandler}
              data-testid="thumbnail-button"
      >
        <ThumbnailTitle title={id} empty={empty}/>
        {
          empty &&
          <div className="empty-content">
            <div className="plus-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <line x1="8" y1="0" x2="8" y2="16" strokeWidth="2.5"/>
                <line x1="0" y1="8" x2="16" y2="8" strokeWidth="2.5"/>
              </svg>
            </div>
            <div className="empty-label">{t("THUMBNAIL_CHOOSER.NEW_MODEL")}</div>
          </div>
        }
        { !empty &&
          <div className={`container ${!selected ? " disabled" : ""}`}>
            <Thumbnail {...content}/>
          </div>
        }
      </button>
        {
          selected && !empty &&
          <button className="close" onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
              <line x1="0" y1="0" x2="12" y2="12" strokeWidth="2.5"/>
              <line x1="12" y1="0" x2="0" y2="12" strokeWidth="2.5"/>
            </svg>
          </button>
        }
    </div>
  );
};
