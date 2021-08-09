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
}

const PrevButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled} = props;
  const backClasses = classNames(css["button-back"], {[css.disabled]: !enabled});
  return(
    <button className={backClasses} onClick={onClick} disabled={!enabled}>
      <div className={css["button-icon-container"]}>
        <PrevButtonIcon/>
      </div>
    </button>
  );
};

const NextButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled} = props;
  const backClasses = classNames(css["button-back"], {[css.disabled]: !enabled});
  return(
    <button className={backClasses} onClick={onClick} disabled={!enabled}>
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
}

export const ThumbnailChooser: React.FC<IThumbnailChooserProps> = (props) => {
  const [offset, setOffset] = useState(0);

  const { items, selectedItemId, setSelectedItemId, maxDisplayItems, clearSelectedItemId} = props;
  const effectiveOffset = Math.min(offset, items.length - maxDisplayItems);

  return (
    <div className={css["thumbnail-chooser"]} data-testid="thumbnail-chooser">
      <PrevButton enabled={effectiveOffset > 0} onClick={() => setOffset(effectiveOffset -1)} />
      <div className={css["thumbnail-chooser-list"]}>
        {items.map( (item, index) => {
          // Only display a subset of items
          if(index < effectiveOffset) { return null; }
          if(index - effectiveOffset >= maxDisplayItems) { return null; }
          const {id} = item;
          const selected = id === selectedItemId;
          return (
            <ThumbnailWrapper
              key={item.id}
              selected={selected}
              content={item}
              setSelectedContainerId={setSelectedItemId}
              clearContainer={clearSelectedItemId}
            />
          );
        })}
      </div>

      <NextButton
        enabled={items.length - effectiveOffset > maxDisplayItems}
        onClick={() => setOffset(effectiveOffset +1)}/>
    </div>
  );
};
