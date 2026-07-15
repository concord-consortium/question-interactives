import React, { MouseEvent, useCallback, useRef, useState } from "react";
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
}

type Subinteractive = NonNullable<IAuthoredState["subinteractives"]>[number];

// Resolve the human-readable interactive type (e.g. "Open response", "Image") for a slide,
// falling back to a generic name when the library interactive can't be resolved.
const getInteractiveTypeName = (interactive: Subinteractive) => {
  const url = libraryInteractiveIdToUrl(interactive.libraryInteractiveId, "carousel");
  return getLibraryInteractive(url)?.name || "Interactive content";
};

// react-responsive-carousel keeps every slide in the DOM (off-screen ones are only visually
// offset), so their iframes stay focusable and in the accessibility tree. Marking non-current
// slides `inert` removes them from the tab order and from AT. `inert` isn't a typed React 17
// prop, so we toggle the attribute directly via a ref callback.
const setSlideInert = (el: HTMLElement | null, inert: boolean) => {
  if (!el) return;
  if (inert) {
    el.setAttribute("inert", "");
  } else {
    el.removeAttribute("inert");
  }
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {
  const readOnly = authoredState.required && interactiveState?.submitted;

  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  const accessibility = useAccessibility();

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

  const subinteractives = authoredState.subinteractives || [];
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

  const currentInteractive = subinteractives[currentSlide];
  const slideAnnouncement = currentInteractive
    ? `Slide ${currentSlide + 1} of ${subinteractives.length}: ${getInteractiveTypeName(currentInteractive)}`
    : "";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Carousel">
      <div role="status" aria-live="polite" className={css.visuallyHidden}>{slideAnnouncement}</div>
      <Carousel selectedItem={currentSlide} onChange={updateCurrentSlide} showArrows={false} showIndicators={false} showStatus={false} showThumbs={false} autoPlay={false} dynamicHeight={false} transitionTime={300}>
        {subinteractives.map(function(interactive, index) {
          const subState = subStates && subStates[interactive.id];
          const subinteractiveUrl = libraryInteractiveIdToUrl(interactive.libraryInteractiveId, "carousel");
          const interactiveTypeName = getInteractiveTypeName(interactive);
          const iframeTitle = `Slide ${index + 1}: ${interactiveTypeName}`;
          const logRequestData: Record<string, unknown> = { subinteractive_url: subinteractiveUrl,
                                                            subinteractive_type: interactive.authoredState.questionType,
                                                            subinteractive_sub_type: interactive.authoredState.questionSubType,
                                                            subinteractive_id: interactive.id,
                                                          };
          return (
            <div key={index} ref={(el) => setSlideInert(el, currentSlide !== index)} className={css.runtime} role="group" aria-roledescription="slide" aria-label={`Slide ${index + 1} of ${subinteractives.length}`}>
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
        <button type="button" className={css.prevButton} disabled={currentSlide === 0} aria-label="Previous slide" onClick={previousSlide}>Prev</button>
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
        <button type="button" className={css.nextButton} disabled={currentSlide === subinteractives.length - 1} aria-label="Next slide" onClick={nextSlide}>Next</button>
      </nav>
    </div>
  );
};
