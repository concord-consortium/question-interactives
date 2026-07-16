import React, { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IframeRuntime } from "@concord-consortium/question-interactives-helpers/src/components/iframe-runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { Carousel } from "react-responsive-carousel";
import { getLibraryInteractive, libraryInteractiveIdToUrl } from "@concord-consortium/question-interactives-helpers/src/utilities/library-interactives";
import { cssUrlValue } from "@concord-consortium/question-interactives-helpers/src/utilities/css-url-value";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { useAccessibility } from "@concord-consortium/lara-interactive-api";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

// Resolve the human-readable interactive type (e.g. "Open response", "Image") from a slide's
// already-resolved subinteractive URL, falling back to a generic name when it can't be resolved.
const getInteractiveTypeName = (subinteractiveUrl: string) =>
  getLibraryInteractive(subinteractiveUrl)?.name || "Interactive content";

// react-responsive-carousel keeps every slide in the DOM (off-screen ones are only visually
// offset), so their iframes stay focusable and in the accessibility tree. In the runtime we
// mark non-current slides `inert` to remove them from the tab order and from AT (matching the
// one-slide-at-a-time carousel pattern). In report mode we skip inert so a reviewer can read
// every response. `inert` isn't a typed React 17 prop, so we toggle the attribute directly via
// a ref callback.
//
// We rely on native `inert` (Baseline "widely available" since 2023 — Chrome/Safari 2022,
// Firefox 112) with no polyfill. On a browser predating that support, `inert` is ignored and
// the off-screen slides fall back to react-responsive-carousel's raw behavior: still focusable
// and in the DOM. A keyboard user tabbing past the current slide's last control would then step
// into a visually off-screen slide's iframe. This is disorienting, not blocking — focus is not
// trapped; continued tabbing walks through the hidden content and eventually reaches the nav
// buttons, it just does so with no visual indication of where focus is. We accept that edge case
// rather than pulling in wicg-inert. Add the polyfill here if an older-browser target ever
// becomes a requirement.
const setSlideInert = (el: HTMLElement | null, inert: boolean) => {
  if (!el) return;
  if (inert) {
    el.setAttribute("inert", "");
  } else {
    el.removeAttribute("inert");
  }
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = authoredState.required && interactiveState?.submitted;
  // Memoized so its reference is stable across renders (the `|| []` fallback would otherwise
  // produce a new array each render, defeating the slideInfos memo below).
  const subinteractives = useMemo(() => authoredState.subinteractives || [], [authoredState.subinteractives]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  const accessibility = useAccessibility();

  // Resolve each slide's subinteractive URL + human-readable type once, reused by both the
  // slide render and the slide-change announcement (avoids resolving the current slide twice
  // per render).
  const slideInfos = useMemo(
    () => subinteractives.map((interactive) => {
      const url = libraryInteractiveIdToUrl(interactive.libraryInteractiveId, "carousel");
      return { url, typeName: getInteractiveTypeName(url) };
    }),
    [subinteractives]
  );

  // Announce slide changes to screen readers via the polite live region, but stay silent on the
  // initial mount: slide 1 is already visible on load, so re-announcing it would be redundant.
  // Only subsequent changes are announced (including navigating back to the first slide).
  const [slideAnnouncement, setSlideAnnouncement] = useState("");
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const info = slideInfos[currentSlide];
    if (info) {
      setSlideAnnouncement(`Slide ${currentSlide + 1} of ${slideInfos.length}: ${info.typeName}`);
    }
  }, [currentSlide, slideInfos]);

  const updateCurrentSlide = useCallback((index: number, event?: MouseEvent<HTMLButtonElement>) => {
    if (event) {
      const target = event.currentTarget as HTMLButtonElement;
      target?.focus(); // required for consistent behavior in all browsers
    }
    pauseAllVideos();
    if (currentSlideRef.current !== index) {
      setCurrentSlide(index);
    }
  }, []);

  if (subinteractives.length === 0) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  const subStates = interactiveState?.subinteractiveStates;

  const getAnswerText = (subinteractiveAnswerText: string | undefined) =>
    `${subinteractiveAnswerText ? subinteractiveAnswerText : "no response"}`;

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedStates = {...prevState?.subinteractiveStates, [interactiveId]: newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveStates: updatedStates,
        answerText: getAnswerText(newInteractiveState?.answerText)
      };
    });
  };

  const nextSlide = (event: MouseEvent<HTMLButtonElement>) => {
    if (currentSlide >= subinteractives.length - 1) return; // guard against overrunning the last slide
    const target = event.currentTarget as HTMLButtonElement;
    target.focus(); // required for consistent behavior in all browsers
    setCurrentSlide(currentSlide + 1);
  };

  const previousSlide = (event: MouseEvent<HTMLButtonElement>) => {
    if (currentSlide <= 0) return; // guard against going before the first slide
    const target = event.currentTarget as HTMLButtonElement;
    target.focus(); // required for consistent behavior in all browsers
    setCurrentSlide(currentSlide - 1);
  };

  // TODO: Instead of the below, make a pause API in lara-interactive-api
  const pauseAllVideos = () => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach( (iframe: any) => {
      const video = iframe.contentWindow.document.querySelector("video");
      video?.pause();
    });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Carousel">
      <div role="status" aria-live="polite" className={css.visuallyHidden}>{slideAnnouncement}</div>
      <Carousel selectedItem={currentSlide} onChange={updateCurrentSlide} showArrows={false} showIndicators={false} showStatus={false} showThumbs={false} autoPlay={false} dynamicHeight={false} transitionTime={300}>
        {subinteractives.map(function(interactive, index) {
          const subState = subStates && subStates[interactive.id];
          const { url: subinteractiveUrl, typeName: interactiveTypeName } = slideInfos[index];
          const iframeTitle = `Slide ${index + 1}: ${interactiveTypeName}`;
          const logRequestData: Record<string, unknown> = { subinteractive_url: subinteractiveUrl,
                                                            subinteractive_type: interactive.authoredState.questionType,
                                                            subinteractive_sub_type: interactive.authoredState.questionSubType,
                                                            subinteractive_id: interactive.id,
                                                          };
          return (
            <div key={index} ref={(el) => setSlideInert(el, !report && currentSlide !== index)} className={css.runtime} role="group" aria-roledescription="slide" aria-label={`Slide ${index + 1} of ${subinteractives.length}`}>
              { authoredState.prompt &&
                <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div> }
                <IframeRuntime
                  key={interactive.id}
                  id={interactive.id}
                  url={subinteractiveUrl}
                  authoredState={interactive.authoredState}
                  interactiveState={subState}
                  logRequestData={logRequestData}
                  setInteractiveState={handleNewInteractiveState.bind(null, interactive.id)}
                  onUnloadCallback={handleNewInteractiveState.bind(null, interactive.id)}
                  scrolling="no"
                  accessibility={accessibility}
                  readOnly={readOnly}
                  title={iframeTitle}
                />
            </div>
          );
        })}
      </Carousel>
      <nav data-cy="carousel-nav" aria-label="Carousel navigation">
        <button type="button" className={css.prevButton} aria-disabled={currentSlide === 0} aria-label="Previous slide" onClick={previousSlide}>Prev</button>
        {subinteractives.map(function(interactive, index) {
          let buttonStyle = {};
          let buttonClass = currentSlide === index ? css.activeButton : "";
          if (interactive.navImageUrl) {
            buttonStyle = { backgroundImage: cssUrlValue(interactive.navImageUrl)};
            buttonClass += " " + css.customButton;
          }
          const buttonText = interactive.navImageAltText ? interactive.navImageAltText : `Go to slide ${index + 1}`;
          return (
            <button type="button" key={index} className={buttonClass} style={buttonStyle} title={buttonText} aria-label={buttonText} aria-current={currentSlide === index ? "true" : undefined} onClick={(event) => updateCurrentSlide(index, event)}>{buttonText}</button>
          );
        })}
        <button type="button" className={css.nextButton} aria-disabled={currentSlide === subinteractives.length - 1} aria-label="Next slide" onClick={nextSlide}>Next</button>
      </nav>
    </div>
  );
};
