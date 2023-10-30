import React, {useState} from "react";
import { ThumbnailWrapper } from "./thumbnail-wrapper";
import {IThumbnailProps, ThumbnailModelID} from "./thumbnail";
import NextButtonIcon from "../../assets/arrow-next-icon.svg";
import PrevButtonIcon from "../../assets/arrow-previous-icon.svg";
import classNames from "classnames";

import css from "./thumbnail-chooser.scss";

interface basicButtonProps {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  enabled: boolean;
  wideLayout?: boolean;
}

const PrevButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled, wideLayout} = props;
  const backClasses = classNames(css["arrow-button"], {[css.disabled]: !enabled, [css.wide]: wideLayout});
  return(
    <button className={backClasses} onClick={onClick} data-testid="previous-arrow" disabled={!enabled}>
      <div className={css["button-icon-container"]}>
        <PrevButtonIcon/>
      </div>
    </button>
  );
};

const NextButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled, wideLayout} = props;
  const backClasses = classNames(css["arrow-button"], {[css.disabled]: !enabled, [css.wide]: wideLayout});
  return(
    <button className={backClasses} onClick={onClick} data-testid="next-arrow" disabled={!enabled}>
      <div className={css["button-icon-container"]}>
        <NextButtonIcon/>
      </div>
    </button>
  );
};

export interface IThumbnailChooserProps {
  items: Array<IThumbnailProps>;
  RenderingF: React.FC<IThumbnailProps>;
  selectedItemId: ThumbnailModelID | null;
  setSelectedItemId: (itemId: ThumbnailModelID) => void;
  clearSelectedItemId: (itemId: ThumbnailModelID) => void;
  disableUnselectedThumbnails?: boolean;
  maxDisplayItems: number;
  readOnly: boolean;
  wideLayout?: boolean;
  uploadPreviewMode?: boolean;
  inDialog?: boolean;
}

export const ThumbnailChooser: React.FC<IThumbnailChooserProps> = (props) => {
  const [offset, setOffset] = useState(0);

  const { items, selectedItemId, setSelectedItemId, maxDisplayItems, clearSelectedItemId, readOnly, wideLayout, uploadPreviewMode, inDialog} = props;
  const effectiveOffset = Math.min(offset, items.length - maxDisplayItems);

  return (
    <div className={classNames(css["thumbnail-chooser"], {[css.wide]: wideLayout, [css.uploadPreview]: uploadPreviewMode})} data-testid="thumbnail-chooser">
      {!uploadPreviewMode && <PrevButton wideLayout={wideLayout} enabled={effectiveOffset > 0} onClick={() => setOffset(effectiveOffset -1)} />}
      <div className={classNames(css["thumbnail-chooser-list"], {[css.wide]: wideLayout, [css.uploadPreview]: uploadPreviewMode})}>
        {items.map( (item, index) => {
          const {id, empty, showNewText} = item;
          // Only display a subset of items
          if(index < effectiveOffset) { return null; }
          if(index - effectiveOffset >= maxDisplayItems) { return null; }
          if(readOnly && empty && !uploadPreviewMode) { return null; }
          const selected = id === selectedItemId;
          return (
            <ThumbnailWrapper
              key={item.id}
              selected={selected}
              content={item}
              setSelectedContainerId={setSelectedItemId}
              clearContainer={clearSelectedItemId}
              readOnly={readOnly}
              wideThumbnail={wideLayout}
              uploadPreviewMode={uploadPreviewMode}
              showNewTextOverride={showNewText}
              inDialog={inDialog}
            />
          );
        })}
      </div>

      {!uploadPreviewMode && <NextButton
        enabled={items.length - effectiveOffset > maxDisplayItems}
        onClick={() => setOffset(effectiveOffset +1)}
        wideLayout={wideLayout}
      />}
    </div>
  );
};
