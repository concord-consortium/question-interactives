import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import { IAuthoredState, IInteractiveState } from "./types";
import { log } from "@concord-consortium/lara-interactive-api";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { DynamicText } from "@concord-consortium/dynamic-text";

import css from "./runtime.scss";

// the font size changes here are causing problems so leave it out for now until I can figure out what is causing the problem
// import "./video-js.scss";

import "./video-js.css";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

export const getAspectRatio = (aspectRatio: string) => {
  if (aspectRatio.indexOf(":") > -1) {
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

// If we want to allow authors to choose whether to show/hide captions by default, make this authorable
const captionsOnByDefault = false;

// small sample mp4
// "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4";
// sample captions
// "https://models-resources.s3.amazonaws.com/question-interactives/test-captions.vtt";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const viewedProgress = interactiveState?.percentageViewed || 0;
  const viewedTimestamp = interactiveState?.lastViewedTimestamp || 0;
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const captionsTrackRef = useRef<TextTrack | null>(null);
  const saveStateInterval = useRef<number>(0);
  const videoJsPlayerRef = useRef<videojs.Player|null>(null);
  const [captionDisplayState, setCaptionDisplayState] = useState("disabled"); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [hasStartedPlayback, setHasStartedPlayback] = useState(viewedTimestamp > 0 || viewedProgress > 0);

  // Keep viewedTimestamp in ref, so the useEffect below doesn"t need to list it in its dependency array, and doesn't
  // get triggered each time viewedTimestamp is updated. Its callback treats this value as an initial value.
  // We don't want to reload video player each time new timestamp is saved.
  const viewedTimestampRef = useRef<number>();
  viewedTimestampRef.current = viewedTimestamp;

  useEffect(() => {
    // only initialize the player once
    if (playerRef.current && !videoJsPlayerRef.current) {
      const player: videojs.Player = videoJsPlayerRef.current = videojs(playerRef.current,
        {
          controls: true,
          fluid: !(authoredState.fixedAspectRatio || authoredState.fixedHeight),
          // This is a new property not supported by the current types
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          crossOrigin: "anonymous"
        }, () => {
          const url = authoredState.videoUrl ? authoredState.videoUrl : "";
          player.src(url);

          if (authoredState.captionUrl && player.textTracks().length === 0) {
            player.addRemoteTextTrack({
              kind: "captions",
              language: "en",
              label: "English",
              src: authoredState.captionUrl,
              default: captionsOnByDefault
            }, false);
            // Store a ref to the captions track s we can check visibility later. There is no easy toggle event for captions show/hide
            captionsTrackRef.current = player.textTracks()[0];
            if (captionsTrackRef.current) {
              captionsTrackRef.current.addEventListener("cuechange", () => {
                const currentCue = captionsTrackRef.current?.activeCues?.length && captionsTrackRef.current?.activeCues.length > 0 && captionsTrackRef.current?.activeCues[0];
                log("cue change", { videoUrl: authoredState.videoUrl, currentCue: (currentCue as VTTCue).text });
              });
            }
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
        if (viewedTimestampRef.current) {
          player.currentTime(viewedTimestampRef.current);
        }
      });

      return () => {
        // do not dispose of the video player due to a re-render after the DynamicText
        // context was added, otherwise the video element is deleted and then is not
        // found on the second render - this next line is intentionally commented out
        // player.dispose();
      };
    }
  }, [authoredState]);

  const getViewTime = () => {
    if (playerRef.current) {
      return playerRef.current.currentTime;
    } else {
      return 0;
    }
  };

  const getViewPercentage = () => {
    if (playerRef.current) {
      return playerRef.current.currentTime / playerRef.current.duration;
    } else {
      return 0;
    }
  };

  const handlePlaying = () => {
    setHasStartedPlayback(true);
    if (captionsTrackRef.current) {
      const {mode} = captionsTrackRef.current;
      setCaptionDisplayState(prevMode => {
        if (prevMode !== mode) {
          log("video captions toggled", { videoUrl: authoredState.videoUrl, captions: mode });
        }
        return mode;
      });
    }
    updateState(false, null);
  };

  const handlePlay = () => {
    updateState(true, "video started");
  };

  const handleSeek = () => {
    updateState(true, "video time scrubber used");
  };

  const handleStop = () => {
    updateState(true, "video stopped");
  };

  const updateState = (forceSave: boolean, logMessage: string | null) => {
    // store current playback progress each second
    const updateIntervalReady = Math.trunc(getViewTime()) > saveStateInterval.current;
    if (updateIntervalReady || forceSave) {
      const percentageViewed = getViewPercentage();
      saveStateInterval.current += 1;
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        answerText: `Percentage viewed: ${viewedProgress}`,
        percentageViewed,
        lastViewedTimestamp: getViewTime()
      }));
      if (logMessage) {
        log(logMessage, { videoUrl: authoredState.videoUrl, percentage_viewed: percentageViewed });
      }
    }
  };

  const getPoster = () => {
    const poster = (authoredState.poster || "").trim();
    if (!hasStartedPlayback && !!poster) {
      return poster;
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt &&
        <DynamicText>
          <DecorateChildren decorateOptions={decorateOptions}>
            <div className={css.prompt}>{ authoredState.prompt }</div>
          </DecorateChildren>
        </DynamicText>
      }
      <div className={`${css.videoPlayerContainer} last-viewed${viewedTimestamp}`}>
        <div className="video-player" data-vjs-player={true}>
          <video
            ref={playerRef}
            className="video-js vjs-big-play-centered vjs-fluid"
            poster={getPoster()}
            onTimeUpdate={readOnly ? undefined : handlePlaying}
            onPlay={handlePlay}
            onPause={readOnly ? undefined : handleStop}
            onSeeked={handleSeek}
            controls={!readOnly}
            preload="metadata"
          />
        </div>
      </div>
      {authoredState.caption && <div className={css.caption}><DynamicText>{authoredState.caption}</DynamicText></div>}
      {authoredState.credit && <div className={css.credit}><DynamicText>{authoredState.credit}</DynamicText></div>}
      {
        authoredState.creditLink &&
        <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank" rel="noreferrer">
          {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
        </a></div>}
    </div>
  );
};
