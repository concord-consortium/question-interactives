import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import { IAttachmentUrlRequest, IWriteAttachmentRequest, IAttachmentUrlResponse,
  writeAttachment, readAttachment, getAttachmentUrl
} from "@concord-consortium/lara-interactive-api";

import css from "./runtime.scss";
import iconCss from "../../shared/components/icons.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const audioEnabled = authoredState.audioEnabled;
  const placeholderText = audioEnabled 
                            ? "Please type your answer here, or record your answer using the microphone."
                            : "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const attachedAudioFile = interactiveState?.audioFile ? interactiveState.audioFile : undefined;
  let recordedBlobs: Blob[] = [];
  const [audioUrl, setAudioUrl] = React.useState<string | undefined>(undefined);
  const [startDisabled, setStartDisabled] = React.useState<boolean>(false);
  const [playDisabled, setPlayDisabled] = React.useState<boolean>(false);
  const [stopDisabled, setStopDisabled] = React.useState<boolean>(true);
  const mediaRecorderRef = React.useRef<MediaRecorder>();
  const audioPlayerRef = React.useRef<HTMLAudioElement>(null);

  // This useEffect ensures that a Firestore record exists before we try saving an audio 
  // file. Unless a Firestore record exists, the audio file's attachment metadata will not 
  // be recorded. There should be a better way to handle this. For example, a Firestore 
  // record should be created when an attachment is created, even if there is nothing else 
  // to record in that record. Right now it seems like the Activity Player will only add 
  // attachments to question reponses if some other response content already exists (e.g., 
  // answer text). It won't initialize a Firestore record with only an attachment.
  // React.useEffect(() => {
  //   setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer"}));
  // }, []);

  React.useEffect(() => {
    const fetchAudioUrl = async () => {
      if (attachedAudioFile) {
        const s3Url = await getAttachmentUrl({name: attachedAudioFile});
        setAudioUrl(s3Url);
      }
    };
    fetchAudioUrl();
  }, [attachedAudioFile]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", answerText: event.target.value}));
  };

  const handleAudioRecord = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
               .getUserMedia ({ audio: true })
               .then((stream: any) => {
                 mediaRecorderRef.current = new MediaRecorder(stream);
                 mediaRecorderRef.current.start();
                 setStartDisabled(true);
                 const recordingTimer = setTimeout(handleAudioRecordStop, 3000);
                 mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                   recordedBlobs.push(event.data);
                 };
                 mediaRecorderRef.current.onstop = () => {
                   clearTimeout(recordingTimer);
                   const audioBlobData: Blob | MediaSource = new Blob(recordedBlobs, {type: "audio/ogg;codecs=opus"});
                   handleAudioSave(audioBlobData);
                 };
               })
               .catch((error: string) => {
                 console.log(`getUserMedia Error: ${error}`);
               });
    } else {
      console.log('getUserMedia is not supported by your web browser!');
    }
  };

  const handleAudioRecordStop = () => {
    mediaRecorderRef.current?.stop();
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

  // this probably isn't needed
  const generateFileName = () => {
    const timestamp = Date.now();
    // const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    // const randString = Array(12).join().split(',').map(() => {
    //   return characters.charAt(Math.floor(Math.random() * characters.length));
    // }).join('');
    return  "audio-" + timestamp + ".ogg";
  };

  const handleAudioSave = async (fileData: Blob) => {
    if (fileData) {
      const fileName = attachedAudioFile ? attachedAudioFile : generateFileName();
      const saveFileResponse = await writeAttachment({name: fileName, content: fileData, contentType: "audio/ogg"});
      if (saveFileResponse.status === 200) {
        setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", audioFile: fileName}));
        const s3Url = await getAttachmentUrl({name: fileName});
        setAudioUrl(s3Url);
      } else {
        console.log("Error: " + saveFileResponse.statusText);
      }
    } else {
      console.log("No file data.");
    }
  };

  const handleAudioDelete = () => {
    if (confirm("Are you sure you want to delete the audio recording?")) {
      setAudioUrl(undefined);
      setStartDisabled(false);
      recordedBlobs = [];
      setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", audioFile: undefined}));
      // delete attachment data and file in S3?
    }
  };

  const decorateOptions = useGlossaryDecoration();
  return (
    <fieldset className={css.openResponse}>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt}>
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
        />
        { audioEnabled && !audioUrl &&
          <div className={css.recordButtonContainer}>
            <button
              aria-label="Record Audio"
              title="Record Audio"
              className={`${iconCss.iconRecord} ${css.audioControl} ${startDisabled ? css.active : ""}`}
              disabled={startDisabled}
              onClick={handleAudioRecord}
            >
              <span className={css.buttonText}>Record</span>
            </button>
          </div> }
        { audioEnabled && audioUrl &&
          <div className={css.audioPlayer}>
            <audio ref={audioPlayerRef} controls onEnded={handleAudioPlayEnded}>
              <source src={audioUrl} type="audio/ogg" />
            </audio>
            <div className={css.audioControls}>
              <button
                aria-label="Play Audio"
                title="Play Audio"
                className={`${iconCss.iconAudio} ${css.audioControl} ${playDisabled ? css.active : ""}`}
                disabled={playDisabled}
                onClick={handleAudioPlay}
              >
                <span className={css.buttonText}>Play</span>
              </button>
              <button
                aria-label="Stop Audio"
                title="Stop Audio"
                className={`${iconCss.iconStop} ${css.audioControl} ${stopDisabled ? css.disabled : ""}`}
                disabled={stopDisabled}
                onClick={handleAudioPlayStop}
              >
                <span className={css.buttonText}>Stop</span>
              </button>
              { audioUrl && 
                <button
                  aria-label="Delete Audio"
                  title="Delete Audio"
                  className={`${iconCss.iconDeleteAudio} ${css.audioControl}`}
                  onClick={handleAudioDelete}
                >
                  <span className={css.buttonText}>Delete</span>
                </button> }
            </div>
          </div> }
      </div>
    </fieldset>
  );
};
