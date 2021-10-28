import React, { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import { FieldProps } from "react-jsonschema-form";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import deepEqual from "deep-equal";
import { libraryInteractives, libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import { v4 as uuidv4 } from "uuid";
import { getFirebaseJwt } from "@concord-consortium/lara-interactive-api";

import css from "./iframe-authoring.scss";

// This is only temporary list. In the future, it will be replaced by LARA Interactive API call that returns all the available managed interactives.
const availableInteractives = libraryInteractives;

// This is the id used by the Side-by-Side interactive to connect one of its children as a linked interactive to the other
export const LocalLinkedInteractiveId = "Side-by-side Data";

export const IframeAuthoring: React.FC<FieldProps> = props => {
  const { onChange, formData } = props;
  const { libraryInteractiveId, authoredState, id, navImageUrl, navImageAltText } = formData;
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ authoringOpened, setAuthoringOpened ] = useState(false);
  const interactiveWrapperClass = authoringOpened ? `${css.iframeAuthoring} ${css.open}` : css.iframeAuthoring;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();
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
    // Nested interactives Side-By-Side interactives can't link to other top-level interactives in order to consume
    // their data, but we want to allow a graph (or any other consumer) to request the data from the other sibling
    // nested interactive. This response to `getInteractiveList` allows the author to select "Side-by-side Data" from
    // the drop-down list.
    // We can do this "blindly" without needing the id of the other interactive because the Side-by-Side runtime will
    // be handling the data connection.
    phone.addListener("getInteractiveList", (request)=> {
      phone.post("interactiveList",
        {
          requestId: request.requestId,
          interactives: [
            {
              id: LocalLinkedInteractiveId,
              pageId: 0,
              name: "",
              section: "interactive_box",
              url: "",
              thumbnailUrl: null,
              supportsSnapshots: false
            }
          ]
        }
      );
    });
    // if we have local linked interactives, we need to pass them in the linkedInteractives array
    let linkedInteractives: {id: string; label: string}[] = [];
    const libraryInteractive = libraryInteractives.find(i => i.libraryInteractiveId === libraryInteractiveId);
    if (libraryInteractive?.localLinkedInteractiveProp && authoredState?.[libraryInteractive.localLinkedInteractiveProp]) {
      linkedInteractives = [ {id: authoredState[libraryInteractive.localLinkedInteractiveProp], label: libraryInteractive.localLinkedInteractiveProp} ];
    }
    phone.post("initInteractive", {
      mode: "authoring",
      authoredState,
      hostFeatures: {
        getFirebaseJwt: {version: "1.0.0"}
      },
      linkedInteractives
    });
  }, [id, libraryInteractiveId, onChange, authoredState, navImageUrl, navImageAltText]);

  useEffect(() => {
    // Trigger reload ONLY if URL has changed or authored state is different than current iframe state.
    // This can happen when iframes are reordered using react-jsochschema-form array controls. More details in the
    // initial comment about `iframeCurrentAuthoredState`. `deepEqual` is used, as when `===` was used, sometimes iframe
    // was reloaded unnecessarily (e.g. during very fast typing in textarea, probably multiple messages have been sent).
    const url = libraryInteractiveIdToUrl(libraryInteractiveId, "side-by-side");
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
            <iframe id={id} ref={iframeRef} width="100%" height={iframeHeight} frameBorder={0} />
          </div>
        </div>
      }
    </div>
  );
};
