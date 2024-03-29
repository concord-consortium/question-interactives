import React, { SyntheticEvent, useRef } from "react";
import { setSupportedFeatures, showModal } from "@concord-consortium/lara-interactive-api";
import ReactDOMServer from "react-dom/server";
import { log } from "@concord-consortium/lara-interactive-api";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import ZoomIcon from "@concord-consortium/question-interactives-helpers/src/icons/zoom-in.svg";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IAuthoredState } from "./types";

import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  report?: boolean;
}

interface IImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const decorateOptions = useGlossaryDecoration();
  const { url, highResUrl, altText, caption, credit, creditLink, creditLinkDisplayText, scaling } = authoredState;
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
    const allowUpscale = scaling === "fitWidth";
    const modalImageUrl = highResUrl || url;
    const title = `<strong>${caption || ""}</strong> <em>${credit || ""}</em> ${ReactDOMServer.renderToString(getCreditLink(false) || <span/>)}`;
    modalImageUrl && showModal({ type: "lightbox", url: modalImageUrl, isImage: true, allowUpscale, title });
    log("image zoomed in", { url });
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const image = e.currentTarget as HTMLImageElement;
    image.onerror = null;
    if (highResUrl) {
      image.src = highResUrl;
    }
  };

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
          src={url}
          onError={handleImageError}
          alt={altText}
          title={altText}
          onLoad={getOriginalImageSize}
        />
      </div>
      <div className={css.captionAndZoomIn}>
        <div className={css.textContainer}>
          {
            caption &&
            <DynamicText>
              <DecorateChildren decorateOptions={decorateOptions}>
                <div className={css.caption}>{caption}</div>
              </DecorateChildren>
            </DynamicText>
          }
          { credit && <div className={css.credit}><DynamicText>{credit}</DynamicText></div> }
          { getCreditLink() }
        </div>
        <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleClick}><ZoomIcon /></div>
      </div>
    </div>
  );
};
