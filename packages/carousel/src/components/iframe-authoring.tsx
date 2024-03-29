import React, { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import { FieldProps } from "@rjsf/utils";
import { IframePhone } from "@concord-consortium/question-interactives-helpers/src/types";
import iframePhone from "iframe-phone";
import deepEqual from "deep-equal";
import { libraryInteractives, libraryInteractiveIdToUrl } from "@concord-consortium/question-interactives-helpers/src/utilities/library-interactives";
import { v4 as uuidv4 } from "uuid";
import { ImageUploadComponent } from "@concord-consortium/question-interactives-helpers/src/widgets/image-upload/image-upload-widget";
import { IFormContext } from "@concord-consortium/question-interactives-helpers/src/components/base-authoring";
import { getFirebaseJwt } from "@concord-consortium/lara-interactive-api";

import css from "./iframe-authoring.scss";

// This is only temporary list. In the future, it will be replaced by LARA Interactive API call that returns all the available managed interactives.
const availableInteractives = libraryInteractives;

export const IframeAuthoring: React.FC<FieldProps> = props => {
  const { onChange, formData } = props;
  const { tokenServiceClient } = props.formContext as IFormContext<unknown>;
  const { libraryInteractiveId, authoredState, id, navImageUrl, navImageAltText } = formData || {};
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
    onChange({
      libraryInteractiveId: newLibraryInteractiveId,
      authoredState: undefined,
      id: id || uuidv4(),
      navImageUrl: navImageUrl || "",
      navImageAltText: navImageAltText || ""
    });
  };

  const handleNavImageUrlChange = (newNavImageUrl: string) => {
    onChange({libraryInteractiveId, authoredState, id,
      navImageUrl: newNavImageUrl || "",
      navImageAltText: navImageAltText || ""
    });
  };

  const handleNavImageAltTextChange = (newNavImageAltText: string) => {
    onChange({libraryInteractiveId, id,
      authoredState: undefined,
      navImageUrl: navImageUrl || "",
      navImageAltText: newNavImageAltText || ""
    });
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
      onChange({libraryInteractiveId,
        authoredState: newAuthoredState,
        id: id || uuidv4(),
        navImageUrl: navImageUrl || "",
        navImageAltText: navImageAltText || ""
      });
    });
    phone.addListener("height", (newHeight: number) => {
      setIframeHeight(newHeight);
    });
    phone.addListener("getFirebaseJWT", async (request) => {
      const {requestId, firebase_app} = request;
      const jwt = await getFirebaseJwt(firebase_app);
      const response = {requestId, ...jwt};
      phone.post("firebaseJWT", response);
    });
    phone.post("initInteractive", {
      mode: "authoring",
      authoredState,
      hostFeatures: {
        getFirebaseJwt: {version: "1.0.0"}
      }
    });
  }, [id, libraryInteractiveId, onChange, authoredState, navImageUrl, navImageAltText]);

  useEffect(() => {
    // Trigger reload ONLY if URL has changed or authored state is different than current iframe state.
    // This can happen when iframes are reordered using react-jsochschema-form array controls. More details in the
    // initial comment about `iframeCurrentAuthoredState`. `deepEqual` is used, as when `===` was used, sometimes iframe
    // was reloaded unnecessarily (e.g. during very fast typing in textarea, probably multiple messages have been sent).
    const url = libraryInteractiveIdToUrl(libraryInteractiveId, "carousel");
    if (iframeRef.current && (url !== iframeRef.current.src || !deepEqual(iframeCurrentAuthoredState.current, authoredState))) {
      phoneRef.current?.disconnect();
      iframeCurrentAuthoredState.current = authoredState;
      iframeRef.current.src = url;
      phoneRef.current = new iframePhone.ParentEndpoint(iframeRef.current, initInteractive);
    }
  }, [libraryInteractiveId, authoredState, initInteractive, navImageUrl, navImageAltText]);

  return (
    <div className={css.iframeAuthoring}>
      Interactive: <select onChange={handleLibraryInteractiveIdChange} value={libraryInteractiveId} data-cy="select-subquestion">
        { availableInteractives.map(o => <option key={o.libraryInteractiveId} value={o.libraryInteractiveId}>{o.name}</option>) }
      </select>
      {
        libraryInteractiveId &&
        <div className={interactiveWrapperClass}>
          <h4 onClick={handleHeaderClick} className={css.link} data-cy="subquestion-authoring">{authoringOpened ? "▼" : "▶"} Subquestion Authoring</h4>
          <div className={css.iframeContainer} style={{maxHeight: authoringOpened ? iframeHeight : 0 }}>
            <div className={css.navButtonField}>
              <label htmlFor="navImageUrl">Custom Navigation Button Image URL</label>
              <ImageUploadComponent className="form-control" id="navImageUrl" defaultValue={navImageUrl} onChange={handleNavImageUrlChange} tokenServiceClient={tokenServiceClient} />
              <p className="help-block">To customize the button for this slide, enter an image URL. Optimal image size: 150x100 pixels.</p>
              <label htmlFor="navImageAltText">Custom Navigation Button Image Alt Text</label>
              <ImageUploadComponent className="form-control" id="navImageAltText" defaultValue={navImageAltText} onChange={handleNavImageAltTextChange} tokenServiceClient={tokenServiceClient} />
              <p className="help-block">To customize the alt text for a custom navigation button, enter your text.</p>
            </div>
            <iframe id={id} ref={iframeRef} width="100%" height={iframeHeight} frameBorder={0} />
          </div>
        </div>
      }
    </div>
  );
};
