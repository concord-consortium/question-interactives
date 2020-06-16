import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import { IAuthoredState } from "./app";
import { IInteractiveState } from "./app";
import css from "./runtime.scss";

import "./video-js.css";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

export const getAspectRatio = (aspectRatio: string) => {
  if (aspectRatio.indexOf(':') > -1) {
    // user supplied aspect ratio as a:b, so use it
    return aspectRatio;
  }
  else {
    if (aspectRatio.length === 0 || isNaN(+aspectRatio)) {
      return "";
    }
    else {
      // numeric - so make it into a:b format
      const roundedAspect = Math.round(parseFloat(aspectRatio) * 100);
      return `${roundedAspect}:100`;
    }
  }
};

// small sample mp4
// "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4";
// sample captions
// "https://models-resources.s3.amazonaws.com/question-interactives/test-captions.vtt";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  let viewedProgress = interactiveState?.percentageViewed || 0;
  let viewedTimestamp = interactiveState?.lastViewedTimestamp || 0;
  const playerRef = useRef<HTMLVideoElement>(null);
  const saveStateInterval = useRef<number>(0);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(viewedTimestamp > 0 || viewedProgress > 0);
  useEffect(() => {
    const player = loadPlayer();
    return () => {
      player.dispose();
    };
  }, []);
  const getViewTime = () => {
    if (playerRef.current) {
      return playerRef.current.currentTime;
    }
    else return 0;
  };
  const getViewPercentage = () => {
    if (playerRef.current) {
      return playerRef.current.currentTime / playerRef.current.duration;
    }
    else return 0;
  };

  const loadPlayer = () => {
    const player: videojs.Player = videojs(playerRef.current,
      {
        controls: true,
        fluid: authoredState.fixedAspectRatio || authoredState.fixedHeight ? false : true,
        // This is a new property not supported by the current types
        // @ts-ignore
        crossOrigin: "anonymous"
      }, () => {
        const url = authoredState.videoUrl ? authoredState.videoUrl : "";
        player.src(url);

        if (authoredState.captionUrl) {
          player.addRemoteTextTrack({
            kind: 'captions',
            language: 'en',
            label: 'English',
            src: authoredState.captionUrl,
            'default': true
          }, false);
        }
      });

    if (authoredState.fixedAspectRatio) {
      const aspectRatio = getAspectRatio(authoredState.fixedAspectRatio);
      if (aspectRatio.length > 0) {
        player.aspectRatio(aspectRatio);
      }
    }
    if (authoredState.fixedHeight) {
      player.height(authoredState.fixedHeight);
    }
    player.ready(() => {
      if (viewedTimestamp) {
        player.currentTime(viewedTimestamp);
      }
    });

    return player;
  };

  const handlePlaying = (e: any) => {
    setHasStartedPlayback(true);
    // store current playback progress each second
    if (Math.trunc(getViewTime()) > saveStateInterval.current) {
      saveStateInterval.current += 1;
      updateState();
    }
  };

  const handleStop = (e: any) => {
    updateState();
  };

  const updateState = () => {
    viewedTimestamp = getViewTime();
    viewedProgress = getViewPercentage();
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "interactive_state",
      answerText: `Percentage viewed: ${viewedProgress}`,
      percentageViewed: viewedProgress,
      lastViewedTimestamp: viewedTimestamp
    }));
  };

  const getPoster = () => {
    if (!hasStartedPlayback) {
      return authoredState.poster;
    }
    else return;
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div className={css.prompt}>{ authoredState.prompt }</div> }
      <div className={`${css.videoPlayerContainer} last-viewed${viewedTimestamp}`}>
        <div className="video-player" data-vjs-player={true}>
          <video ref={playerRef} className="video-js vjs-big-play-centered vjs-fluid"
            poster={getPoster()}
            onTimeUpdate={readOnly ? undefined : handlePlaying}
            onEnded={readOnly ? undefined : handleStop}
            onPause={readOnly ? undefined : handleStop}
            controls={!readOnly}
          />
        </div>
      </div>
      {interactiveState?.lastViewedTimestamp && <div className={css.lastViewed}>{interactiveState.lastViewedTimestamp}</div>}
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {
        authoredState.creditLink &&
        <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank">
          {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
        </a></div>}
    </div>
  );
};
