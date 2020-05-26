import React, { useRef, useEffect } from "react";
import { IAuthoredState } from "./authoring";
import { useRequiredQuestion } from "../../shared/hooks/use-required-question";
import videojs from "video.js";
import css from "./runtime.scss";

import "./video-js.css";

export interface IInteractiveState {
  percentageViewed: number;
  submitted?: boolean;
}

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}
// small sample mp4
// "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4";
// sample captions
// "https://models-resources.s3.amazonaws.com/question-interactives/test-captions.vtt";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, setNavigation, report }) => {
  let viewedProgress = interactiveState?.percentageViewed || 0;
  const playerRef = useRef(null);

  const getViewPercentage = () => {
    if (playerRef.current) {
      const video: HTMLVideoElement = playerRef.current! as HTMLVideoElement;
      return video.currentTime / video.duration;
    }
    else return 0;
  };
  const getViewedTimestamp = () => {
    if (!viewedProgress) return 0;
    if (!playerRef.current) return 0;
    const video: HTMLVideoElement = playerRef.current! as HTMLVideoElement;
    return viewedProgress * video.duration;
  };

  const { submitButton, lockedInfo } = useRequiredQuestion({ authoredState, interactiveState, setInteractiveState, setNavigation, isAnswered: viewedProgress > 0.96 });
  useEffect(() => {
    loadPlayer();
  }, []);

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

    if (viewedProgress) {
      player.currentTime(getViewedTimestamp());
    }

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

  const handleChange = (e: any) => {
    viewedProgress = getViewPercentage();
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { percentageViewed: viewedProgress }));
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div className={css.prompt}>{ authoredState.prompt }</div> }
      <div className={css.videoPlayerContainer}>
        <div className="video-player" data-vjs-player={true}>
          <video ref={playerRef} className="video-js vjs-big-play-centered vjs-fluid"
            poster={authoredState.poster}
            onPlaying={report ? undefined : handleChange}
            onTimeUpdate={report ? undefined : handleChange}
            onEnded={report ? undefined : handleChange}
          />
        </div>
      </div>
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {authoredState.creditLink && <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank">
        {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
      </a></div>}
      {
        !report &&
        <div>
          { submitButton }
          { lockedInfo }
        </div>
      }
    </div>
  );
};
