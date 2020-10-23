import React, { useRef } from "react";
import { IAuthoredState } from "./types";
import {
  IRuntimeInitInteractive, setSupportedFeatures, showModal, useInitMessage
} from "@concord-consortium/lara-interactive-api";
import ReactDOMServer from "react-dom/server";
import { v4 as uuidv4 } from "uuid";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";
import ZoomIcon from "../../shared/icons/zoom-in.svg";

interface IProps {
  authoredState: IAuthoredState;
  report?: boolean;
}

interface IImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState, report }) => {
  const { url, highResUrl, altText,
    caption, credit, creditLink, creditLinkDisplayText, scaling, isShowingModal } = authoredState;
  const initMsg = useInitMessage() as IRuntimeInitInteractive;
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

  const showImageLightbox = () => {
    const size = imageSize.current?.width && imageSize.current?.height
                  ? { width: imageSize.current.width, height: imageSize.current.height }
                  : undefined;
    const allowUpscale = scaling === "fitWidth";
    const modalImageUrl = highResUrl || url;
    const uuid = uuidv4();
    const title = `<strong>${caption || ""}</strong> <em>${credit || ""}</em> ${ReactDOMServer.renderToString(getCreditLink(false) || <span/>)}`;
    modalImageUrl && showModal({ uuid, type: "lightbox", url: modalImageUrl,
                        isImage: true, size, allowUpscale, title });
    log("image zoomed in", { url });
  };

  const showInteractiveLightbox = () => {
    const uuid = uuidv4();
    showModal({uuid, type: "lightbox", url: window.location.href + "?highres"});
  };

  const handleClick = initMsg?.hostFeatures?.modalDialog?.imageLightbox
                        ? showImageLightbox
                        : showInteractiveLightbox;

  const getCreditLink = (displayBlock = true) => {
    // const { creditLink, creditLinkDisplayText } = authoredState;
    const link = <a href={creditLink} target="_blank" rel="noreferrer noopener">
      {creditLinkDisplayText || creditLink}
    </a>;
    if (displayBlock) {
      return creditLink && (
        <div className={css.creditLink}>
          {link}
        </div>
      );
    } else {
      return creditLink && link;
    }
  };

  return (
    <div className={css.runtime}>
      <div className={`${css.imageContainer} ${getImageLayout()}`} onClick={handleClick}>
        <img
          src={isShowingModal && highResUrl ? highResUrl : url}
          alt={altText}
          title={altText}
          onLoad={getOriginalImageSize}
        />
      </div>
      {caption && <div className={css.caption}>{caption}</div>}
      {credit && <div className={css.credit}>{credit}</div>}
      {getCreditLink()}
      <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleClick}><ZoomIcon /></div>
    </div>
  );
};
