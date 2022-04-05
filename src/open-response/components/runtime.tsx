import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import { getAttachmentUrl, log, writeAttachment } from "@concord-consortium/lara-interactive-api";
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
  const [audioUrl, setAudioUrl] = React.useState<string | undefined>(undefined);
  const [audioSupported, setAudioSupported] = React.useState(browserSupportsAudio);
  const [recordingStarted, setRecordingStarted] = React.useState(false);
  const [recordingDisabled, setRecordingDisabled] = React.useState(false);
  const [recordingFailed, setRecordingFailed] = React.useState(false);
  const [playDisabled, setPlayDisabled] = React.useState(false);
  const [stopDisabled, setStopDisabled] = React.useState(true);
  const mediaRecorderRef = React.useRef<MediaRecorder>();
  const audioPlayerRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
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
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "open_response_answer",
      answerText: value
    }));
  };

  const handleAudioRecord = () => {
    if (audioSupported) {
      setRecordingFailed(false);
      navigator.mediaDevices
               .getUserMedia ({ audio: true })
               .then((stream: any) => {
                 mediaRecorderRef.current = new MediaRecorder(stream);
                 mediaRecorderRef.current.addEventListener("dataavailable", (event: BlobEvent) => {
                   recordedBlobs.push(event.data);
                 });
                 mediaRecorderRef.current.addEventListener("stop", () => {
                   clearTimeout(recordingTimer);
                   const audioBlobData: Blob | MediaSource = new Blob(recordedBlobs, {type: "audio/mpeg"});
                   handleAudioSave(audioBlobData);
                 });
                 mediaRecorderRef.current.start();
                 setRecordingStarted(true);
                 const recordingTimer = setTimeout(handleAudioRecordStop, 60000);
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
    setRecordingStarted(false);
  };

  const handleAudioPlay = () => {
    audioPlayerRef.current?.play();
    setPlayDisabled(true);
    setStopDisabled(false);
  };

  const handleAudioPlayStop = () => {
    audioPlayerRef.current?.pause();
    handleAudioPlayEnded();
  };

  const handleAudioPlayEnded = () => {
    setPlayDisabled(false);
    setStopDisabled(true);
  };

  const generateFileName = () => {
    const timestamp = Date.now();
    return  "audio-" + timestamp + ".mp3";
  };

  const handleAudioSave = async (fileData: Blob) => {
    setRecordingDisabled(true);
    if (fileData) {
      const fileName = attachedAudioFile ? attachedAudioFile : generateFileName();
      const saveFileResponse = await writeAttachment({name: fileName, content: fileData, contentType: "audio/mpeg"});
      if (saveFileResponse.status === 200) {
        setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", audioFile: fileName}));
        const s3Url = await getAttachmentUrl({name: fileName});
        setAudioUrl(s3Url);
        log("audio response recorded", {fileName});
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
      setRecordingStarted(false);
      setRecordingDisabled(false);
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
  return (
    <fieldset className={css.openResponse}>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt} data-testid="legend">
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren> }
      <div className={css.inputContainer}>
        <textarea
          value={answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={placeholderText}
          data-testid="response-textarea"
        />
        { audioEnabled && !audioUrl && !readOnly && 
          <div className={css.recordButtonContainer}>
            { recordingDisabled && <span className={css.saveIndicator}>Saving. Please wait...</span> }
            { recordingFailed && <span className={css.saveIndicator}>Recording failed. Please try again.</span> }
            <button
              aria-label="Record Audio"
              title="Record Audio"
              className={`${iconCss.iconRecord} ${css.audioControl} ${recordingStarted ? css.recordingActive : ""}`}
              onClick={recordingStarted ? handleAudioRecordStop : handleAudioRecord }
              disabled={recordingDisabled}
              data-testid="audio-record-button"
            >
              <span className={css.buttonText}>Record</span>
            </button>
          </div> }
        { audioEnabled && audioUrl &&
          <div className={css.audioPlayer}>
            <audio ref={audioPlayerRef} controls preload="auto" onEnded={handleAudioPlayEnded}>
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
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
            </div>
          </div> }
      </div>
    </fieldset>
  );
};
