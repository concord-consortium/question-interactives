import React, { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { IframeRuntime } from "../../shared/components/iframe-runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { Carousel } from "react-responsive-carousel";
import { libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import { cssUrlValue } from "../../shared/utilities/css-url-value";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {

  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

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

  // This scroll handler triggers the carousel to set the current slide when
  // a user uses their keyboard to tab directly through the slides (without
  // using the carousel's navigation buttons).
  const handleScroll = useCallback((scroller: any) => {
    const scrollPosition = scroller.scrollLeft;
    if (scrollPosition > 0) {
      scroller.scrollLeft = 0;
      updateCurrentSlide(currentSlideRef.current + 1);
    }
  }, [updateCurrentSlide]);

  useEffect(() => {
    const scroller = document.querySelector(".slider-wrapper");
    if (scroller) {
      (scroller as any).onscroll = () => {
        handleScroll(scroller);
      };
    }
  }, [handleScroll]);

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
        answerText: getAnswerText(newInteractiveState.answerText)
      };
    });
  };

  const nextSlide = (event: MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget as HTMLButtonElement;
    target.focus(); // required for consistent behavior in all browsers
    setCurrentSlide(currentSlide + 1);
  };

  const previousSlide = (event: MouseEvent<HTMLButtonElement>) => {
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
    <div>
      <Carousel selectedItem={currentSlide} onChange={updateCurrentSlide} showArrows={false} showIndicators={false} showStatus={false} showThumbs={false} autoPlay={false} dynamicHeight={false} transitionTime={300}>
        {subinteractives.map(function(interactive, index) {
          const subState = subStates && subStates[interactive.id];
          const subinteractiveUrl = libraryInteractiveIdToUrl(interactive.libraryInteractiveId, "carousel");
          const logRequestData: Record<string, unknown> = { subinteractive_url: subinteractiveUrl,
                                                            subinteractive_type: interactive.authoredState.questionType,
                                                            subinteractive_sub_type: interactive.authoredState.questionSubType,
                                                            subinteractive_id: interactive.id,
                                                          };
          return (
            <div key={index} className={css.runtime}>
              { authoredState.prompt &&
                <div>{renderHTML(authoredState.prompt)}</div> }
                <IframeRuntime
                  key={interactive.id}
                  id={interactive.id}
                  url={subinteractiveUrl}
                  authoredState={interactive.authoredState}
                  interactiveState={subState}
                  logRequestData={logRequestData}
                  setInteractiveState={handleNewInteractiveState.bind(null, interactive.id)}
                  onUnloadCallback={handleNewInteractiveState.bind(null, interactive.id)}
                />
            </div>
          );
        })}
      </Carousel>
      <nav data-cy="carousel-nav">
        <button className={currentSlide === 0 ? css.disabled + " " + css.prevButton : css.prevButton} onClick={previousSlide}>Prev</button>
        {subinteractives.map(function(interactive, index) {
          let buttonStyle = {};
          let buttonClass = currentSlide === index ? css.activeButton : "";
          if (interactive.navImageUrl) {
            buttonStyle = { backgroundImage: cssUrlValue(interactive.navImageUrl)};
            buttonClass += " " + css.customButton;
          }
          const buttonText = interactive.navImageAltText ? interactive.navImageAltText : `Go to slide ${index + 1}`;
          return (
            <button key={index} className={buttonClass} style={buttonStyle} title={buttonText} aria-label={buttonText} onClick={(event) => updateCurrentSlide(index, event)}>{buttonText}</button>
          );
        })}
        <button className={currentSlide === subinteractives.length - 1 ? css.disabled + " " + css.nextButton : css.nextButton} onClick={nextSlide}>Next</button>
      </nav>
    </div>
  );
};
