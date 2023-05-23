import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { VoiceTyping } from "@concord-consortium/question-interactives-helpers/src/utilities/voice-typing";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { getAttachmentUrl, IGetInteractiveState, log, setOnUnload, writeAttachment } from "@concord-consortium/lara-interactive-api";
import AudioRecorder from "audio-recorder-polyfill";
import { DynamicText } from "@concord-consortium/dynamic-text";

import PauseIcon from "@concord-consortium/question-interactives-helpers/src/icons/pause-icon.svg";
import PlayIcon from "@concord-consortium/question-interactives-helpers/src/icons/play-icon.svg";
import StopIcon from "@concord-consortium/question-interactives-helpers/src/icons/stop-icon.svg";
import RecordIcon from "@concord-consortium/question-interactives-helpers/src/icons/recording-icon.svg";
import VoiceTypingIcon from "@concord-consortium/question-interactives-helpers/src/icons/voice-typing-icon.svg";
import DeleteIcon from "@concord-consortium/question-interactives-helpers/src/icons/delete-button-no-drop-shadow.svg";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

interface IVoiceTypingControlsProps {
  readOnly: boolean;
  voiceTypingEnabled: boolean;
  voiceTypingActive: boolean;
  handleToggleVoiceTyping: () => void;
}

interface IAudioRecordingControlsProps {
  readOnly: boolean;
  audioEnabled: boolean;
  audioUrl?: string;
  playing: boolean;
  recordingActive: boolean;
  recordingDisabled: boolean;
  recordingFailed: boolean;
  timerReading: string;
  audioPlayerRef: React.RefObject<HTMLAudioElement>;
  handleAudioPlayStop: () => void;
  handleAudioPlay: () => void;
  handleAudioRecordStop: () => void;
  handleAudioRecord: () => void;
  handleAudioDelete: () => void;
  handleAudioPlayEnded: () => void;
}

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

const isSpaceOrEnterKey = (e: React.KeyboardEvent<HTMLOrSVGElement>) => {
  return (e.code === "Space") || (e.code === "Enter");
};

export const VoiceTypingControls: React.FC<IVoiceTypingControlsProps> = (props) => {
  const {readOnly, voiceTypingEnabled, voiceTypingActive, handleToggleVoiceTyping} = props;
  const voiceTypingLabel = voiceTypingActive ? "Stop Voice Typing" : "Start Voice Typing";

  if (readOnly || !voiceTypingEnabled || !VoiceTyping.Supported) {
    return null;
  }

  // emulate buttons
  const handleKeyUp = (e: React.KeyboardEvent<HTMLOrSVGElement>) => {
    if (isSpaceOrEnterKey(e)) {
      handleToggleVoiceTyping();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={css.controls}>
      <div className={`${css.controlContainer} ${voiceTypingActive ? css.active : ""}`}>
        <VoiceTypingIcon
          role="button"
          aria-label={voiceTypingLabel}
          title={voiceTypingLabel}
          className={css.control}
          onClick={handleToggleVoiceTyping}
          onKeyUp={handleKeyUp}
          data-testid="voice-typing-button"
          tabIndex={0}
        />
      </div>
    </div>
  );
};

export const AudioRecordingControls: React.FC<IAudioRecordingControlsProps> = (props) => {
  const {
    readOnly, audioEnabled, audioUrl, playing, recordingActive, recordingDisabled, recordingFailed,
    timerReading,
    handleAudioPlayStop, handleAudioPlay, handleAudioRecordStop, handleAudioRecord, handleAudioDelete
  } = props;

  if (readOnly || !audioEnabled) {
    return null;
  }

  let buttonLabel = "";
  let buttonActive = false;
  let buttonDisabled = false;
  let ButtonIcon: any;
  let testId = "";
  let handleButtonClick: () => void = () => undefined;

  if (audioUrl) {
    buttonLabel = playing ? "Pause Audio" : "Play Audio";
    buttonActive = playing;
    buttonDisabled = false;
    ButtonIcon = playing ? PauseIcon : PlayIcon;
    testId = "audio-play-or-pause-button";
    handleButtonClick = playing ? handleAudioPlayStop : handleAudioPlay;
  } else {
    buttonLabel = recordingActive ? "Stop Recording Audio" : "Record Audio";
    buttonActive = recordingActive;
    buttonDisabled = recordingDisabled;
    ButtonIcon = recordingActive || recordingDisabled ? StopIcon : RecordIcon;
    testId = "audio-record-button";
    handleButtonClick = recordingActive ? handleAudioRecordStop : handleAudioRecord;
  }

  // emulate buttons
  const handleKeyUp = (e: React.KeyboardEvent<HTMLOrSVGElement>) => {
    if (isSpaceOrEnterKey(e)) {
      handleButtonClick();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={css.controls}>
      { recordingDisabled && <span className={css.saveIndicator} data-testid="saving-indicator">Saving ...</span> }
      { recordingFailed && <span className={css.saveIndicator} data-testid="saving-indicator">Save failed!</span> }

      <div className={`${css.controlContainer} ${buttonActive ? css.active : ""}`}>
        <ButtonIcon
          role="button"
          aria-label={buttonLabel}
          title={buttonLabel}
          className={css.control}
          onClick={handleButtonClick}
          onKeyUp={handleKeyUp}
          disabled={buttonDisabled}
          data-testid={testId}
          tabIndex={0}
          />
      </div>
      <div
        className={`${css.timer} ${timerReading === "00:00" ? css.zero : ""} ${buttonActive ? css.active : ""}`}
        data-testid="timer-readout"
      >
        {timerReading}
        <div className={css.deleteContainer}>
          {audioUrl && <DeleteIcon onClick={handleAudioDelete} data-testid="audio-delete-button" />}
        </div>
      </div>
    </div>
  );
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const demo = !!authoredState.demo;
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
  const [playing, setPlaying] = useState(false);
  const [timerReading, setTimerReading] = useState<string>("00:00");
  const [voiceTypingActive, setVoiceTypingActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const audioTimerRef = useRef<any>();
  const textAreaRef = useRef<HTMLTextAreaElement|null>(null);
  const selectionRef = useRef<{start: number, end: number}>({start: 0, end: 0});
  const voiceTypingRef = useRef<VoiceTyping>();
  const initialTextRef = useRef("");
  const lastTranscriptRef = useRef("");

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
      lastTranscriptRef.current = "";
      voiceTypingRef.current.enable(transcript => {
        if (transcript !== lastTranscriptRef.current) {
          const selection = selectionRef.current || {start: 0, end: 0};
          const updatedText = [
            initialTextRef.current.substring(0, selection.start),
            transcript,
            initialTextRef.current.substring(selection.end)
          ].join("");
          handleUpdateTextArea(updatedText);
          lastTranscriptRef.current = transcript;
          log("voice typing updated", {voiceText: transcript});
        }
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
      log("audio response started");
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
    log("audio response stopped");
    mediaRecorderRef.current?.stop();
    setRecordingActive(false);
    clearInterval(audioTimerRef.current);
    setTimerReading("00:00");
  };

  const handleAudioPlay = () => {
    log("audio response start playing");
    audioPlayerRef.current?.play();
    setPlaying(true);

    audioTimerRef.current = setInterval(() => {
      if (audioPlayerRef.current) {
        const mins = String(Math.floor(audioPlayerRef.current.currentTime / 60)).padStart(2, "0");
        const secs = String(Math.floor(audioPlayerRef.current.currentTime % 60)).padStart(2, "0");
        setTimerReading(`${mins}:${secs}`);
      }
    }, 100);

    if (demo) {
      setTimeout(() => {
        handleAudioPlayEnded();
      }, 2000);
    }
  };

  const handleAudioPlayStop = () => {
    log("audio response stopped playing");
    audioPlayerRef.current?.pause();
    handleAudioPlayEnded();
    clearInterval(audioTimerRef.current);
  };

  const handleAudioPlayEnded = () => {
    log("audio response play ended");
    setPlaying(false);
  };

  const generateFileName = () => {
    const timestamp = Date.now();
    return  "audio" + timestamp + ".mp3";
  };

  const handleAudioSave = async (fileData: Blob, timeElapsed: number) => {
    if (demo) {
      setRecordingDisabled(true);
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const url = URL.createObjectURL(fileData);
          console.log("AUDIO URL", url);
          setAudioUrl(url);
          setRecordingSaved(true);
          setRecordingDisabled(false);
          resolve();
        }, 1000);
      });
      return;
    }

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
      }
    } else {
      handleRecordingFailure("No file data.");
    }
    setRecordingDisabled(false);
  };

  const handleAudioDelete = () => {
    if (confirm("Are you sure you want to delete the audio recording?")) {
      log("audio response deleted");
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
    setVoiceTypingActive(prevVoiceTypingActive => {
      const currentText = textAreaRef.current?.value || "";
      if (prevVoiceTypingActive) {
        log("voice typing stopped", {finalText: currentText});
        // re-focus in the textarea when the voice typing is turned off
        setTimeout(() => textAreaRef.current?.focus(), 1);
      } else {
        log("voice typing started", {startingText: currentText});
      }
      return !prevVoiceTypingActive;
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
        <div className={css.controlsContainer}>
          <VoiceTypingControls
            readOnly={readOnly || false}
            voiceTypingActive={voiceTypingActive}
            voiceTypingEnabled={voiceTypingEnabled || false}
            handleToggleVoiceTyping={handleToggleVoiceTyping}
          />
          {audioUrl && <audio ref={audioPlayerRef} controls preload="auto" onEnded={handleAudioPlayEnded}>
            <source src={audioUrl} type="audio/mpeg" />
          </audio>}
          <AudioRecordingControls
            readOnly={readOnly || false}
            audioEnabled={audioEnabled || false}
            audioUrl={audioUrl}
            playing={playing}
            recordingActive={recordingActive}
            recordingDisabled={recordingDisabled}
            recordingFailed={recordingFailed}
            timerReading={timerReading}
            audioPlayerRef={audioPlayerRef}
            handleAudioPlayStop={handleAudioPlayStop}
            handleAudioPlay={handleAudioPlay}
            handleAudioRecordStop={handleAudioRecordStop}
            handleAudioRecord={handleAudioRecord}
            handleAudioDelete={handleAudioDelete}
            handleAudioPlayEnded={handleAudioPlayEnded}
          />
        </div>
      </div>
    </fieldset>
  );
};
