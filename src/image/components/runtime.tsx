import React, { useRef } from "react";
import { IAuthoredState } from "./app";
import { setSupportedFeatures, showModal } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  report?: boolean;
}

interface ImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState, report }) => {

  const imageSize = useRef<ImageSize>();

  const getImageLayout = () => {
    switch (authoredState.scaling) {
      case "fitWidth":
        return css.fitWidth;
      case "originalDimensions":
        return css.originalDimensions;
    }
  };

  const getOriginalImageSize = (e: any) => {
    if (e.target && e.target.naturalWidth && e.target.naturalHeight) {
      imageSize.current = { width: e.target.naturalWidth, height: e.target.naturalHeight }
      const aspectRatio = e.target.naturalWidth / e.target.naturalHeight;
      setSupportedFeatures({
        interactiveState: true,
        authoredState: true,
        aspectRatio
      });
    }
  };

  const handleClick = () => {
    const { url } = authoredState;
    const size = imageSize.current?.width && imageSize.current?.height
                  ? { width: imageSize.current.width, height: imageSize.current.height }
                  : undefined;
    const allowUpscale = authoredState.scaling === "fitWidth";
    url && showModal({ uuid: "image", type: "lightbox", url,
                        isImage: true, size, allowUpscale,
                        title: `${authoredState.caption || ""} ${authoredState.credit || ""}` });
  }

  return (
    <div className={css.runtime}>
      <div className={`${css.imageContainer} ${getImageLayout()}`} onClick={handleClick}>
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
