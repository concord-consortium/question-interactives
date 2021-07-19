import React, {useState} from "react";
import { ThumbnailWrapper } from "./thumbnail-wrapper";
import {IThumbnailProps, ThumbnailModelID} from "./thumbnail";
import NextButtonIcon from "../../assets/arrow-next-icon.svg";
import PrevButtonIcon from "../../assets/arrow-previous-icon.svg";
import classNames from "classnames";

import "./thumbnail-chooser.scss";
interface basicButtonProps {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  enabled: boolean;
}

const PrevButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled} = props;
  const backClasses = classNames("button-back", {disabled: !enabled});
  return(
    <div className={backClasses} onClick={onClick}>
      <div className="button-icon-container">
        <PrevButtonIcon/>
      </div>
    </div>
  );
};

const NextButton:React.FC<basicButtonProps> = (props: basicButtonProps) => {
  const {onClick, enabled} = props;
  const backClasses = classNames("button-back", {disabled: !enabled});
  return(
    <div className={backClasses} onClick={onClick}>
      <div className="button-icon-container">
        <NextButtonIcon/>
      </div>
    </div>
  );
};

export interface IThumbnailChooserProps {
  items: Array<IThumbnailProps>;
  RenderingF: React.FC<IThumbnailProps>;
  selectedItemID: ThumbnailModelID | null;
  setSelectedItemID: (itemId: ThumbnailModelID) => void;
  clearSelectedItemID: (itemId: ThumbnailModelID) => void;
  disableUnselectedThumbnails?: boolean;
}

export const ThumbnailChooser: React.FC<IThumbnailChooserProps> = (props) => {
  const [offset, setOffset] = useState(0);

  const {
    items, selectedItemID,
    setSelectedItemID: setSelectedItemId, clearSelectedItemID: clearSelectedItemId,
  } = props;
  const maxDisplayItems = 4;
  const effectiveOffset = Math.min(offset, items.length - maxDisplayItems);

  return (
    <div className="thumbnail-chooser" data-testid="thumbnail-chooser">
      <PrevButton enabled={effectiveOffset > 0} onClick={() => setOffset(effectiveOffset -1)} />
      <div className="thumbnail-chooser-list">
        {items.map( (item, index) => {
          // Only display a subset of items
          if(index < effectiveOffset) { return null; }
          if(index - effectiveOffset >= maxDisplayItems) { return null; }
          const {id} = item;
          const selected = id === selectedItemID;
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
