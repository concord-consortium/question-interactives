import React, { useRef } from "react";
import { IAuthoredState } from "./app";
import { setSupportedFeatures, showModal } from "@concord-consortium/lara-interactive-api";
import ReactDOMServer from "react-dom/server";
import { v4 as uuidv4 } from "uuid";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";
import ZoomIcon from "../../shared/icons/zoom.svg";

interface IProps {
  authoredState: IAuthoredState;
  report?: boolean;
}

interface IImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState, report }) => {

  const imageSize = useRef<IImageSize>();

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
      imageSize.current = { width: e.target.naturalWidth, height: e.target.naturalHeight };
      const aspectRatio = e.target.naturalWidth / e.target.naturalHeight;
      setSupportedFeatures({
        interactiveState: true,
        authoredState: true,
        aspectRatio
      });
    }
  };

  const handleClick = () => {
    const { url, highResUrl, credit, caption } = authoredState;
    const size = imageSize.current?.width && imageSize.current?.height
                  ? { width: imageSize.current.width, height: imageSize.current.height }
                  : undefined;
    const allowUpscale = authoredState.scaling === "fitWidth";
    const modalImageUrl = highResUrl || url;
    const uuid = uuidv4();
    const title = `<strong>${caption || ""}</strong> <em>${credit || ""}</em> ${ReactDOMServer.renderToString(getCreditLink(false) || <span/>)}`;
    modalImageUrl && showModal({ uuid, type: "lightbox", url: modalImageUrl,
                        isImage: true, size, allowUpscale, title });
    log("image zoomed in", { url });
  };

  const getCreditLink = (displayBlock = true) => {
    const { creditLink, creditLinkDisplayText } = authoredState;
    const link = <a href={creditLink} target="_blank" rel="noreferrer noopener">
                  {creditLinkDisplayText || creditLink}
                </a>
    if (displayBlock) {
      return creditLink && (
        <div className={css.creditLink}>
          {link}
        </div>
      )
    } else {
      return creditLink && link
    }
  };

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
      {getCreditLink()}
      <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleClick}><ZoomIcon /></div>
    </div>
  );
};
