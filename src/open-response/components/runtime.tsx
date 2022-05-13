import React, { useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import { getAttachmentUrl, IGetInteractiveState, log, setOnUnload, writeAttachment } from "@concord-consortium/lara-interactive-api";
import AudioRecorder from "audio-recorder-polyfill";

import css from "./runtime.scss";
import iconCss from "../../shared/components/icons.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const fetchAudioUrl = async (attachedAudioFile: string) => {
  if (attachedAudioFile) {
    return await getAttachmentUrl({name: attachedAudioFile});
  }
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const audioEnabled = authoredState.audioEnabled;
  window.MediaRecorder = AudioRecorder;
  const browserSupportsAudio = !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  const placeholderText = audioEnabled 
                            ? "Please type your answer here, or record your answer using the microphone."
                            : "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const attachedAudioFile = interactiveState?.audioFile ? interactiveState.audioFile : undefined;
  let recordedBlobs: Blob[] = [];
  const defaultHeight = 212;
  const [textareaHeight, setTextareaHeight] = useState<number>(defaultHeight);
  const [textareaWidth, setTextareaWidth] = useState<number | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioSupported, setAudioSupported] = useState(browserSupportsAudio);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingDisabled, setRecordingDisabled] = useState(false);
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [playDisabled, setPlayDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [timerReading, setTimerReading] = useState<string>("00:00");
  const mediaRecorderRef = useRef<MediaRecorder>();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const audioTimerRef = useRef<any>();

  useEffect(() => {
    setOnUnload((options: IGetInteractiveState) => {
      if (options.unloading) {
        return new Promise(resolve => {
          if (mediaRecorderRef.current && recordingActive) {
            // Do not resolve in order to update the final interactive state. 
            // The stop handler will do that, which will complete the 
            // onUnload promise in the host.
            handleAudioRecordStop();
          } else {
            resolve(interactiveState || {});
          }
        });
      }
      return Promise.resolve(interactiveState || {});
    });
  }, [interactiveState, recordingActive]);

  useEffect(() => {
    const getAudioUrl = async () => {
      if (attachedAudioFile) {
        const s3Url = await fetchAudioUrl(attachedAudioFile);
        setAudioUrl(s3Url);
      }
    };
    getAudioUrl();
  }, [attachedAudioFile]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    const target = event.currentTarget as HTMLTextAreaElement;
    if (audioEnabled && target.scrollHeight >= defaultHeight) {
      setTextareaHeight(target.scrollHeight);
    }
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "open_response_answer",
      answerText: value
    }));
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    setTextareaHeight(target.offsetHeight);
    setTextareaWidth(target.offsetWidth);
  };

  const handleAudioRecord = () => {
    let secondsElapsed = 0;
    if (audioSupported) {
      setRecordingFailed(false);
      const startTime = Date.now();
      navigator.mediaDevices
               .getUserMedia ({ audio: true })
               .then((stream: any) => {
                 mediaRecorderRef.current = new MediaRecorder(stream);
                 mediaRecorderRef.current.addEventListener("dataavailable", (event: BlobEvent) => {
                   recordedBlobs.push(event.data);
                 });
                 mediaRecorderRef.current.addEventListener("stop", () => {
                   clearTimeout(recordingTimer);
                   const timeElapsed = Math.round((Date.now() - startTime)/1000);
                   const audioBlobData: Blob | MediaSource = new Blob(recordedBlobs, {type: "audio/mpeg"});
                   handleAudioSave(audioBlobData, timeElapsed);
                 });
                 mediaRecorderRef.current.start();
                 setRecordingActive(true);
                 const recordingTimer = setTimeout(handleAudioRecordStop, 61000);
                 audioTimerRef.current = setInterval(() => {
                   secondsElapsed = audioTimerRef.current === 60 ? 0 : secondsElapsed + 1;
                   const minutesElapsed = audioTimerRef.current >= 60 ? Math.floor(secondsElapsed / 60) : 0;
                   const mins = String(minutesElapsed).padStart(2, "0");
                   const secs = String(secondsElapsed).padStart(2, "0");
                   setTimerReading(`${mins}:${secs}`);
                 }, 1000);
               })
               .catch((error: string) => {
                 handleRecordingFailure(`${error}`);
               });
    } else {
      setAudioSupported(false);
      alert("The audio recording feature is not supported by your web browser. Please upgrade your browser if you wish to record an audio response.");
    }
  };

  const handleAudioRecordStop = () => {
    mediaRecorderRef.current?.stop();
    setRecordingActive(false);
    clearInterval(audioTimerRef.current);
    setTimerReading("00:00");
  };

  const handleAudioPlay = () => {
    audioPlayerRef.current?.play();
    setPlayDisabled(true);
    setStopDisabled(false);

    audioTimerRef.current = setInterval(() => {
      if (audioPlayerRef.current) {
        const mins = String(Math.floor(audioPlayerRef.current.currentTime / 60)).padStart(2, "0");
        const secs = String(Math.floor(audioPlayerRef.current.currentTime % 60)).padStart(2, "0");
        setTimerReading(`${mins}:${secs}`);
      }
    }, 100);
  };

  const handleAudioPlayStop = () => {
    audioPlayerRef.current?.pause();
    handleAudioPlayEnded();
    clearInterval(audioTimerRef.current);
  };

  const handleAudioPlayEnded = () => {
    setPlayDisabled(false);
    setStopDisabled(true);
  };

  const generateFileName = () => {
    const timestamp = Date.now();
    return  "audio" + timestamp + ".mp3";
  };

  const handleAudioSave = async (fileData: Blob, timeElapsed: number) => {
    setRecordingDisabled(true);
    if (fileData) {
      const fileName = attachedAudioFile ? attachedAudioFile : generateFileName();
      const saveFileResponse = await writeAttachment({name: fileName, content: fileData, contentType: "audio/mpeg"});
      if (saveFileResponse.status === 200) {
        const fileLocation = saveFileResponse.url;
        // Saving the file path to the log is a temporary solution for showing where the audio file can be found 
        // in the S3 bucket. Eventually, the log should be updated to include an accessible, full URL that a 
        // researcher can use to access the audio file in their web browser.
        const filePath = fileLocation.split("?")[0].split("/").slice(-3).join("/");
        setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", audioFile: fileName}));
        const s3Url = await getAttachmentUrl({name: fileName});
        setAudioUrl(s3Url);
        log("audio response recorded", {filePath, fileName, timeElapsed});
      } else {
        handleRecordingFailure(saveFileResponse.statusText);
      }
    } else {
      handleRecordingFailure("No file data.");
    }
  };

  const handleAudioDelete = () => {
    if (confirm("Are you sure you want to delete the audio recording?")) {
      setAudioUrl(undefined);
      setRecordingActive(false);
      setRecordingDisabled(false);
      setTimerReading("00:00");
      recordedBlobs = [];
      setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", audioFile: undefined}));
    }
  };

  const handleRecordingFailure = (error: string) => {
    setRecordingFailed(true);
    setRecordingDisabled(false);
    console.error(`Error: ${error}`);
    log("audio response recording failed", {error});
  };

  const decorateOptions = useGlossaryDecoration();
  const containerWidth = audioEnabled && textareaWidth ? textareaWidth + "px" : undefined;
  const containerStyle = audioEnabled && textareaHeight ? { height: textareaHeight + "px", width: containerWidth } : undefined;
  const textareaStyle = audioEnabled && textareaHeight ? { height: textareaHeight + "px" } : undefined;
  return (
    <fieldset className={css.openResponse}>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt} data-testid="legend">
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren> }
      <div className={`${css.inputContainer} ${audioEnabled ? css.audioEnabled : ""}`} style={containerStyle}>
        <textarea
          value={answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={placeholderText}
          data-testid="response-textarea"
          className={css.openResponseTextarea}
          onMouseUp={audioEnabled ? handleMouseUp : undefined}
          style={textareaStyle}
        />
        { audioEnabled && !audioUrl && !readOnly && 
          <div className={css.recordUIContainer}>
            { recordingDisabled && <span className={css.saveIndicator} data-testid="saving-indicator">Saving. Please wait...</span> }
            { recordingFailed && <span className={css.saveIndicator} data-testid="saving-indicator">Recording failed. Please try again.</span> }
            <div className={css.audioControls}>
              <button
                aria-label="Record Audio"
                title="Record Audio"
                className={`${iconCss.iconRecord} ${css.audioControl} ${recordingActive ? css.recordingActive : ""}`}
                onClick={!recordingActive ? handleAudioRecord : undefined}
                disabled={recordingDisabled}
                data-testid="audio-record-button"
              >
                <span className={css.buttonText}>Record</span>
              </button>
              <span className="timer" data-testid="record-timer-readout">{timerReading}</span>
              <button
                aria-label="Stop Recording Audio"
                title="Stop Recording Audio"
                className={`${iconCss.iconStop} ${css.audioControl} ${!recordingActive ? css.disabled : ""}`}
                onClick={handleAudioRecordStop}
                disabled={recordingDisabled}
                data-testid="audio-stop-record-button"
              >
                <span className={css.buttonText}>Stop</span>
              </button>
            </div>
          </div> }
        { audioEnabled && audioUrl &&
          <div className={css.audioPlayerUIContainer}>
            <audio ref={audioPlayerRef} controls preload="auto" onEnded={handleAudioPlayEnded}>
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
            <button
                  aria-label="Delete Audio"
                  title="Delete Audio"
                  className={`${iconCss.iconDeleteAudio} ${css.audioControl} ${readOnly ? css.disabled : ""}`}
                  onClick={readOnly ? undefined : handleAudioDelete}
                  disabled={readOnly}
                  data-testid="audio-delete-button"
              >
                <span className={css.buttonText}>Delete</span>
              </button>
            <div className={css.audioControls}>
              <button
                aria-label="Play Audio"
                title="Play Audio"
                className={`${iconCss.iconAudio} ${css.audioControl} ${playDisabled ? css.active : ""}`}
                disabled={playDisabled}
                onClick={playDisabled ? undefined : handleAudioPlay}
                data-testid="audio-play-button"
              >
                <span className={css.buttonText}>Play</span>
              </button>
              <span className="timer" data-testid="playback-timer-readout">{timerReading}</span>
              <button
                aria-label="Stop Audio"
                title="Stop Audio"
                className={`${iconCss.iconStop} ${css.audioControl} ${stopDisabled ? css.disabled : ""}`}
                disabled={stopDisabled}
                onClick={stopDisabled ? undefined : handleAudioPlayStop}
                data-testid="audio-stop-button"
              >
                <span className={css.buttonText}>Stop</span>
              </button>
            </div>
          </div> }
      </div>
    </fieldset>
  );
};
