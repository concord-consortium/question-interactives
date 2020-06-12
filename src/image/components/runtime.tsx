import React from "react";
import { IAuthoredState } from "./app";
import { setSupportedFeatures } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, report }) => {

  const getImageLayout = () => {
    switch (authoredState.scaling) {
      case "fitWidth":
        return css.fitWidth;
      case "originalDimensions":
        return css.originalDimensions;
    }
  };

  const getOriginalImageSize = (e: any) => {
    if (e.target && e.target.naturalWidth && e.target.naturalHeight > 0) {
      const aspectRatio = e.target.naturalWidth / e.target.naturalHeight;
      setSupportedFeatures({
        interactiveState: true,
        authoredState: true,
        aspectRatio
      });
    }
  };

  return (
    <div className={css.runtime}>
      <div className={`${css.imageContainer} ${getImageLayout()}`}>
        <img
          src={authoredState.url}
          alt={authoredState.altText}
          title={authoredState.altText}
          onLoad={getOriginalImageSize}
        />
      </div>
      {authoredState.caption && <div className={css.caption}>{authoredState.caption}</div>}
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {
        authoredState.creditLink &&
        <div className={css.creditLink}>
          <a href={authoredState.creditLink} target="_blank">
            {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
          </a>
        </div>
      }
      {authoredState.highResUrl && <div className={css.viewHighRes}>Zoom</div>}
    </div>
  );
};
