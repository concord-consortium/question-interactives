import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import { IAuthoredState } from "./app";
import { IInteractiveState } from "./app";
import css from "./runtime.scss";

import "./video-js.css";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

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
  useEffect(() => {
    if (!report) loadPlayer();
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
        fluid: authoredState.fixedAspectRatio || authoredState.fixedHeight ? false : true
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
      player.aspectRatio(getAspectRatio(authoredState.fixedAspectRatio));
    }
    if (authoredState.fixedHeight) {
      player.height(authoredState.fixedHeight);
    }
    player.ready(() => {
      if (viewedTimestamp) {
        player.currentTime(viewedTimestamp);
      }
    });

    return () => {
      player.dispose();
    };
  };

  const getAspectRatio = (aspectRatio: string) => {
    if (aspectRatio.indexOf(':') > -1) {
      // user supplied aspect ratio as a:b, so use it
      return aspectRatio;
    } else {
      // numeric - so make it into a:b format
      const roundedAspect = Math.round(parseFloat(aspectRatio) * 100);
      return `${roundedAspect}:100`;
    }
  };

  const handlePlaying = (e: any) => {
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
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { percentageViewed: viewedProgress, lastViewedTimestamp: viewedTimestamp }));
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div className={css.prompt}>{ authoredState.prompt }</div> }
      <div className={`${css.videoPlayerContainer} last-viewed${viewedTimestamp}`}>
        <div className="video-player" data-vjs-player={true}>
          <video ref={playerRef} className="video-js vjs-big-play-centered vjs-fluid"
            poster={authoredState.poster}
            onTimeUpdate={readOnly ? undefined : handlePlaying}
            onEnded={readOnly ? undefined : handleStop}
            onPause={readOnly ? undefined : handleStop}
          />
        </div>
      </div>
      {interactiveState?.lastViewedTimestamp && <div className={css.lastViewed}>{interactiveState.lastViewedTimestamp}</div>}
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {authoredState.creditLink && <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank">
        {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
      </a></div>}
    </div>
  );
};
