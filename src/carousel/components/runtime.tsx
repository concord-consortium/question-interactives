import React, { useState } from "react";
import { IframeRuntime } from "./iframe-runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { Carousel } from "react-responsive-carousel";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {

  const [currentSlide, setCurrentSlide] = useState(0);

  const subinteractives = authoredState.subinteractives || [];
  if (subinteractives.length === 0) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }
  const levelsCount = subinteractives.length;

  const currentSubintId = interactiveState?.currentSubinteractiveId;
  let currentInteractive = subinteractives.find(si => si.id === currentSubintId);
  if (!currentInteractive) {
    currentInteractive = subinteractives[0];
  }

  const currentSubintIndex = subinteractives.indexOf(currentInteractive);
  const currentLevel = levelsCount - currentSubintIndex;

  const subStates = interactiveState?.subinteractiveStates;
  const subState = subStates && subStates[currentInteractive.id];

  const getAnswerText = (level: number, subinteractiveAnswerText: string | undefined) =>
    `[Level: ${level}] ${subinteractiveAnswerText ? subinteractiveAnswerText : "no response"}`;

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedStates = {...prevState?.subinteractiveStates, [interactiveId]: newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveStates: updatedStates,
        answerText: getAnswerText(currentLevel, newInteractiveState.answerText)
      };
    });
  };

  const nextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  };

  const previousSlide = () => {
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

  const updateCurrentSlide = (index: number) => {
    pauseAllVideos();
    if (currentSlide !== index) {
      setCurrentSlide(index);
    }
  };

  return (
    <div>
      <Carousel selectedItem={currentSlide} onChange={updateCurrentSlide} showArrows={false} showIndicators={false} showStatus={false} showThumbs={false} autoPlay={false} dynamicHeight={false} transitionTime={300}>
        {subinteractives.map(function(interactive, index) {
          return (
            <div key={index} className={css.runtime} tabIndex={index+1}>
              { authoredState.prompt &&
                <div>{renderHTML(authoredState.prompt)}</div> }
                <IframeRuntime
                  key={interactive.id}
                  id={interactive.id}
                  url={interactive.url}
                  authoredState={interactive.authoredState}
                  interactiveState={subState}
                  setInteractiveState={handleNewInteractiveState.bind(null, interactive.id)}
                  scaffoldedQuestionLevel={currentLevel}
                />
            </div>
          );
        })}
      </Carousel>
      <nav>
        <button className={currentSlide === 0 ? css.disabled + " " + css.prevButton : css.prevButton} onClick={previousSlide}>Prev</button>
        {subinteractives.map(function(interactive, index) {
          return (
            <button key={index} className={currentSlide === index ? css.activeButton : ""} onClick={() => updateCurrentSlide(index)}>{index}</button>
          );
        })}
        <button className={currentSlide === subinteractives.length - 1 ? css.disabled + " " + css.nextButton : css.nextButton} onClick={nextSlide}>Next</button>
      </nav>
    </div>
  );
};