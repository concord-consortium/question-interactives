import React, { useRef } from "react";
import { IAuthoredState } from "./types";
import { setSupportedFeatures, showModal } from "@concord-consortium/lara-interactive-api";
import ReactDOMServer from "react-dom/server";
import { log } from "@concord-consortium/lara-interactive-api";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
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
          alt={altText}
          title={altText}
          onLoad={getOriginalImageSize}
        />
      </div>
      {caption &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <div className={css.caption}>{caption}</div>
        </DecorateChildren> }
      {credit && <div className={css.credit}>{credit}</div>}
      {getCreditLink()}
      <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleClick}><ZoomIcon /></div>
    </div>
  );
};
