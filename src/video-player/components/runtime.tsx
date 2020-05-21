import React, { useRef, useEffect } from "react";
import { IAuthoredState } from "./authoring";
import css from "./runtime.scss";
import videojs from "video.js";

import "./video-js.css";

interface IInteractiveState {
  response: number;
}

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
  const playerRef = useRef(null);

  useEffect(() => {
    loadPlayer();
  }, []);

  const loadPlayer = () => {
    const player: videojs.Player = videojs(playerRef.current,
      {
        controls: true,
        fluid: authoredState.fixedAspectRatio  || authoredState.fixedHeight ? false : true
      }, () => {
      if (authoredState.captionUrl) {
        const textTrack = authoredState.captionUrl;
        player.addRemoteTextTrack({
          kind: 'subtitles',
          language: 'en',
          label: 'English',
          src: textTrack,
          'default': true
        }, true);
      }

      const url = authoredState.videoUrl ? authoredState.videoUrl : "";
      player.src(url);
    });

    if (authoredState.fixedAspectRatio) {
      player.aspectRatio(getAspectRatio(authoredState.fixedAspectRatio));
    }
    if (authoredState.fixedHeight) {
      player.height(authoredState.fixedHeight);
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
  const handleChange = (event: any) => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { response: ((playerRef.current! as HTMLVideoElement).currentTime) }));
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
            onEnded={report ? undefined : handleChange}
            onTimeUpdate={report ? undefined : handleChange}
          />
        </div>
      </div>
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {authoredState.creditLink && <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank">
        {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
      </a></div>}
    </div>
  );
};
