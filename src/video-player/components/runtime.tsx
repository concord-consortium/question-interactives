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
    const player: videojs.Player = videojs(playerRef.current, { controls: true }, () => {
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
    return () => {
      player.dispose();
    };
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
            onPlaying={report ? undefined : handleChange}
            onEnded={report ? undefined : handleChange}
            onTimeUpdate={report ? undefined : handleChange}
          />
        </div>
      </div>
      {authoredState.credit && <div className={css.credit}>{ authoredState.credit }</div> }
    </div>
  );
};
