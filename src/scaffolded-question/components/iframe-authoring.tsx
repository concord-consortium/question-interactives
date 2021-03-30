import React, { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import { FieldProps } from "react-jsonschema-form";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import deepEqual from "deep-equal";
import { v4 as uuidv4 } from "uuid";
import { libraryInteractives, libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import css from "./iframe-authoring.scss";

export const IframeAuthoring: React.FC<FieldProps> = props => {
  const { onChange, formData } = props;
  const { libraryInteractiveId, authoredState, id } = formData;
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ authoringOpened, setAuthoringOpened ] = useState(false);
  const interactiveWrapperClass = authoringOpened ? `${css.iframeAuthoring} ${css.open}` : css.iframeAuthoring;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();
  // We need to keep track of the current iframe state and detect cases when update comes from the parent (e.g. when
  // user reorders iframes using react-jsonschema-forms interface), and only then reload the iframe and provide new
  // init message with the new authored state. Theoretically, we could always provide new state to iframe. But LARA
  // Interactive API lets us do it ONLY after iframe reload in the `init` message. So, the iframe would be reloaded each
  // time user changes anything in the authoring interface (e.g. iframe would reload each time a single character
  // is added to sub-interactive prompt - definitely not user friendly).
  // To avoid all that, LARA Interactive API would need to be extended, so LARA/parent could set the authored
  // state outside `initInteractive` call. But this would require all the existing interactives to be updated.
  const iframeCurrentAuthoredState = useRef<any>();

  const handleLibraryInteractiveIdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newLibraryInteractiveId = event.target.value;
    onChange({ libraryInteractiveId: newLibraryInteractiveId, authoredState: undefined, id: id || uuidv4() });
  };

  const handleHeaderClick = () => {
    setAuthoringOpened(!authoringOpened);
  };

  const initInteractive = useCallback(() => {
    const phone = phoneRef.current;
    if (!phone) {
      return;
    }
    phone.addListener("authoredState", (newAuthoredState: any) => {
      // Save current iframe authored state.
      iframeCurrentAuthoredState.current = newAuthoredState;
      onChange({ libraryInteractiveId, authoredState: newAuthoredState, id: id || uuidv4() });
    });
    phone.addListener("height", (newHeight: number) => {
      setIframeHeight(newHeight);
    });
    phone.post("initInteractive", {
      mode: "authoring",
      authoredState
    });
  }, [id, libraryInteractiveId, onChange, authoredState]);

  useEffect(() => {
    const url = libraryInteractiveIdToUrl(libraryInteractiveId,"scaffolded-question");
    // Trigger reload ONLY if URL has changed or authored state is different than current iframe state.
    // This can happen when iframes are reordered using react-jsochschema-form array controls. More details in the
    // initial comment about `iframeCurrentAuthoredState`. `deepEqual` is used, as when `===` was used, sometimes iframe
    // was reloaded unnecessarily (e.g. during very fast typing in textarea, probably multiple messages have been sent).
    if (iframeRef.current && (url !== iframeRef.current.src || !deepEqual(iframeCurrentAuthoredState.current, authoredState))) {
      phoneRef.current?.disconnect();
      iframeCurrentAuthoredState.current = authoredState;
      iframeRef.current.src = url;
      phoneRef.current = new iframePhone.ParentEndpoint(iframeRef.current, initInteractive);
    }
  }, [libraryInteractiveId, authoredState, initInteractive]);

  return (
    <div className={css.iframeAuthoring}>
      Interactive: <select onChange={handleLibraryInteractiveIdChange} value={libraryInteractiveId} data-cy="select-subquestion">
        { libraryInteractives.map(o => <option key={o.libraryInteractiveId} value={o.libraryInteractiveId}>{o.name}</option>) }
      </select>
      {
        libraryInteractiveId &&
        <div className={interactiveWrapperClass}>
          <h4 onClick={handleHeaderClick} className={css.link} data-cy="subquestion-authoring">{authoringOpened ? "▼" : "▶"} Subquestion authoring</h4>
          <div className={css.iframeContainer} style={{maxHeight: authoringOpened ? iframeHeight : 0 }}>
            <iframe id={id} ref={iframeRef} width="100%" height={iframeHeight} frameBorder={0} />
          </div>
        </div>
      }
    </div>
  );
};
