import React, { useRef, RefObject } from "react";
import { IAuthoredState } from "./app";
import { setSupportedFeatures, showModal } from "@concord-consortium/lara-interactive-api";
import ReactDOMServer from "react-dom/server";
import { v4 as uuidv4 } from "uuid";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";
import ZoomIcon from "../../shared/icons/zoom.svg";
import { useAutoHeight } from "../../shared/hooks/use-auto-height";

interface IProps {
  authoredState: IAuthoredState;
  baseContainer: RefObject<HTMLDivElement>;
  report?: boolean;
}

interface IImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState, baseContainer, report }) => {

  const imageSize = useRef<IImageSize>();

  const creditTextContainer = useRef<HTMLDivElement>(null);

  // We've disabled the autoHeight hook provided by the base app
  // When the scaling is fitWidth then the image change its size based on the
  // width of the container, so we should use LARA aspect raio setting. This
  // way the image's width and height will be limited so the whole thing shows
  // within the viewport.
  // When the scaling is originalDimensions then it is best to use autoHeight
  // because the height of the interactive is fixed based on the image height
  // the image does not resize in this case so this is perfect for using LARA's
  // height option
  useAutoHeight({ container: baseContainer, disabled: authoredState.scaling === "fitWidth" });

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

      if (authoredState.scaling === "fitWidth") {
        if (!baseContainer.current) {
          // FIMXE:
          // If the image loads before the baseContainer is initialized this will
          // default to LARA default aspect ratio of 1.3
          // That will result in a clipped image in most cases.
          // A better solution would be to delay the execution of this method
          // until both the image is loaded and the baseContainer is available
          console.error("image interactive baseContainer not available. aspectRatio will be wrong");
          return;
        }
        // We use the baseContainer height to capture all of the spacing
        // in the container. We can't use the image's aspect ratio
        // directly because there is various bits of padding around the container.
        const baseContainerHeight = baseContainer.current.scrollHeight;

        // HACK: the aspectRatio is dependent on the iframe's width. When the iframe
        // is more narrow, then the caption and magnifying glass will
        // take up a larger percentage of the height. Additionally the caption
        // can start wrapping so its actual pixel height will get larger.
        // It is possible for the interactive to send a new aspectRatio
        // whenever its width changes. However this can cause a race or infinite
        // loop:
        //   If the interactive is in the interactive box and the user resizes
        //   the window then the width of the interactive will change. This would
        //   trigger a re-calcuation of the aspectRatio in the interactive.
        //   When the interactive sends this new aspectRaio to LARA,
        //   LARA will re-calcuate the width and height of the interactive again.
        //   LARA's calculation of the width will change if the
        //   users browser is short so maintainig the aspect ratio means limiting
        //   the width.  This width change will trigger the interactive to send a
        //   new aspect ratio. This will go on and on.
        // We can probably add some more complex logic to make sure this loop
        // eventually stops. This would probably require some hysteresis.
        // Instead of that complexity, here is just a fudge factor to add a little
        // extra padding.
        const creditTextHeight = creditTextContainer.current?.clientHeight || 0;

        // This calcuation is only done once. It is best think of two cases:
        // 1. If the interactive starts small
        // then the percentage of the height taken up by the creditText will large
        // so the number of pixels allocated to it will get larger if the
        // interactive gets larger and the aspectRatio is maintained.
        // In this case there should be no clipping issues.
        // But there might be a large white space below the interactive.
        // 2. If the width starts large
        // then percentage of height taken up by the creditText will be small,
        // so the number of pixels allocated will get too small as the width is
        // decreased and the aspectRatio is maintained.
        // In this case the caption will get clipped.
        //
        // So with calcuation below the fudgeFactor will get bigger the larger
        // the width of the interactive is.
        const fudgeFactor = window.innerWidth < 300 ? 0 : (window.innerWidth - 300) / 200;
        const fudgedPadding = creditTextHeight * fudgeFactor;

        const computedHeight = baseContainerHeight + fudgedPadding;
        // I don't know if window.innerWidth is the best dimension to use here
        // perhaps we should use rooContainer.currrent.scrollWidth instead?
        const aspectRatio = window.innerWidth / computedHeight;
        console.log("setting aspect ratio",
          {baseContainerHeight, creditTextHeight, fudgedPadding,
           computedHeight, aspectRatio});
        setSupportedFeatures({
          interactiveState: true,
          authoredState: true,
          aspectRatio
        });
      }
    }
  };

  const handleClick = () => {
    const { url, highResUrl, credit, caption } = authoredState;
    // CHECKME: the size here is what is passed to showModal however that modal
    // is supposed to be showing the highRes image. But the size here is the
    // native width and height of the image. Perhaps showModal is just figuring
    // out an aspectRatio from this size? Otherwise the modal will not really
    // fill the space of the screen with the highRes image.
    // If the size is used directly by the modal then it would be easy for a
    // large main image to cause the modal to be larger than the screen.
    const size = imageSize.current?.width && imageSize.current?.height
                  ? { width: imageSize.current.width, height: imageSize.current.height }
                  : undefined;
    const allowUpscale = authoredState.scaling === "fitWidth";
    const modalImageUrl = highResUrl || url;
    const uuid = uuidv4();
    const title = `<strong>${caption || ""}</strong> <em>${credit || ""}</em> ${ReactDOMServer.renderToString(getCreditLink() || <span/>)}`;
    modalImageUrl && showModal({ uuid, type: "lightbox", url: modalImageUrl,
                        isImage: true, size, allowUpscale, title });
    log("image zoomed in", { url });
  };

  const getCreditLink = () => {
    const { creditLink, creditLinkDisplayText } = authoredState;
    return creditLink && (
      <div className={css.creditLink}>
        <a href={creditLink} target="_blank" rel="noreferrer noopener">
          {creditLinkDisplayText || creditLink}
        </a>
      </div>
    );
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
      <div ref={creditTextContainer}>
        {authoredState.caption && <div className={css.caption}>{authoredState.caption}</div>}
        {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
        {getCreditLink()}
        <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleClick}><ZoomIcon /></div>
      </div>
    </div>
  );
};
