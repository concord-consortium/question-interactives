import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { VoiceTyping } from "@concord-consortium/question-interactives-helpers/src/utilities/voice-typing";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { getAttachmentUrl, IGetInteractiveState, log, setOnUnload, writeAttachment } from "@concord-consortium/lara-interactive-api";
import AudioRecorder from "audio-recorder-polyfill";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./runtime.scss";
import iconCss from "@concord-consortium/question-interactives-helpers/src/components/icons.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const fetchAudioUrl = async (attachedAudioFile: string) => {
  if (attachedAudioFile) {
    return await getAttachmentUrl({name: attachedAudioFile});
  }
};

export const getPlaceholderText = (authoredState: Pick<IAuthoredState, "audioEnabled"|"voiceTypingEnabled">) => {
  const {audioEnabled, voiceTypingEnabled} = authoredState;

  if (audioEnabled && (voiceTypingEnabled && VoiceTyping.Supported)) {
    return "Please type or voice type your answer here, or record your answer using the microphone.";
  }
  if (voiceTypingEnabled && VoiceTyping.Supported) {
    return "Please type or voice type your answer here.";
  }
  if (audioEnabled) {
    return "Please type your answer here, or record your answer using the microphone.";
  }
  return "Please type your answer here.";
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const {audioEnabled, voiceTypingEnabled} = authoredState;
  window.MediaRecorder = AudioRecorder;
  const browserSupportsAudio = !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  const placeholderText = getPlaceholderText(authoredState);
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
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [playDisabled, setPlayDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [timerReading, setTimerReading] = useState<string>("00:00");
  const [voiceTypingActive, setVoiceTypingActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const audioTimerRef = useRef<any>();
  const textAreaRef = useRef<HTMLTextAreaElement|null>(null);
  const selectionRef = useRef<{start: number, end: number}>({start: 0, end: 0});
  const voiceTypingRef = useRef<VoiceTyping>();
  const initialTextRef = useRef("");

  useEffect(() => {
    setOnUnload((options: IGetInteractiveState) => {
      if (options.unloading) {
        const activeRecordingNotYetSaved = recordingActive || (recordingDisabled && !recordingSaved);
        return new Promise(resolve => {
          if (mediaRecorderRef.current && activeRecordingNotYetSaved) {
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
  }, [interactiveState, recordingActive, recordingDisabled, recordingSaved]);

  useEffect(() => {
    const getAudioUrl = async () => {
      if (attachedAudioFile) {
        const s3Url = await fetchAudioUrl(attachedAudioFile);
        setAudioUrl(s3Url);
      }
    };
    getAudioUrl();
  }, [attachedAudioFile]);

  const handleUpdateTextArea = useCallback((value: string) => {
    if (audioEnabled && textAreaRef.current && textAreaRef.current.scrollHeight >= defaultHeight) {
      setTextareaHeight(textAreaRef.current.scrollHeight);
    }
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "open_response_answer",
      answerText: value
    }));
  }, [setTextareaHeight, setInteractiveState, audioEnabled]);

  useEffect(() => {
    voiceTypingRef.current = voiceTypingRef.current || new VoiceTyping();
    if (voiceTypingActive) {
      initialTextRef.current = textAreaRef.current?.value || "";
      voiceTypingRef.current.enable(transcript => {
        const selection = selectionRef.current || {start: 0, end: 0};
        handleUpdateTextArea([
          initialTextRef.current.substring(0, selection.start),
          transcript,
          initialTextRef.current.substring(selection.end)
        ].join(""));
      });
    }
    return () => voiceTypingRef.current?.disable();
  }, [voiceTypingActive, handleUpdateTextArea]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdateTextArea(event.target.value);
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
                 setRecordingSaved(false);
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
        setRecordingSaved(true);
        log("audio response recorded", {filePath, fileName, timeElapsed});
      } else {
        handleRecordingFailure(saveFileResponse.statusText);
        setRecordingDisabled(false);
      }
    } else {
      handleRecordingFailure("No file data.");
      setRecordingDisabled(false);
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

  const handleFocusOrBlurTextArea = () => {
    selectionRef.current = {
      start: textAreaRef.current?.selectionStart || 0,
      end: textAreaRef.current?.selectionEnd || 0
    };
  };

  const handleToggleVoiceTyping = () => {
    setVoiceTypingActive(prev => {
      if (prev) {
        setTimeout(() => textAreaRef.current?.focus(), 1);
      }
      return !prev;
    });
  };

  const handleClickTextArea = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // end voice typing if the user clicks on the (disabled) text area during voice typing
    if (voiceTypingActive && e.target === textAreaRef.current) {
      handleToggleVoiceTyping();
    }
  }, [voiceTypingActive]);

  const decorateOptions = useGlossaryDecoration();
  const containerWidth = audioEnabled && textareaWidth ? textareaWidth + "px" : undefined;
  const containerStyle = audioEnabled && textareaHeight ? { height: textareaHeight + "px", width: containerWidth } : undefined;
  const textareaStyle = audioEnabled && textareaHeight ? { height: textareaHeight + "px" } : undefined;
  const voiceTypingLabel = voiceTypingActive ? "Stop Voice Typing" : "Start Voice Typing";

  return (
    <fieldset className={css.openResponse}>
      { authoredState.prompt &&
        <DynamicText>
          <DecorateChildren decorateOptions={decorateOptions}>
            <legend className={css.prompt} data-testid="legend">
              {renderHTML(authoredState.prompt)}
            </legend>
          </DecorateChildren>
        </DynamicText>
      }
      <div className={`${css.inputContainer} ${audioEnabled ? css.audioEnabled : ""}`} style={containerStyle} onClick={handleClickTextArea}>
        <textarea
          value={answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly || voiceTypingActive}
          rows={8}
          placeholder={placeholderText}
          data-testid="response-textarea"
          className={css.openResponseTextarea}
          onMouseUp={audioEnabled ? handleMouseUp : undefined}
          style={textareaStyle}
          ref={textAreaRef}
          onBlur={handleFocusOrBlurTextArea}
          onFocus={handleFocusOrBlurTextArea}
        />
        {!readOnly && ((voiceTypingEnabled && VoiceTyping.Supported) || audioEnabled) &&
          <div className={css.recordUIContainer}>
            {voiceTypingEnabled && VoiceTyping.Supported &&
            <div className={css.voiceTypingControls}>
              <button
                aria-label={voiceTypingLabel}
                title={voiceTypingLabel}
                className={`${iconCss.iconVoiceTyping} ${css.audioControl2} ${voiceTypingActive ? css.voiceTypingActive : ""}`}
                onClick={handleToggleVoiceTyping}
                data-testid="voice-typing-button"
              >
                <span className={css.buttonText}>{voiceTypingLabel}</span>
              </button>
            </div> }
            {audioEnabled && !audioUrl &&
            <>
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
            </>}
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
        </div> }
      </div>
    </fieldset>
  );
};
