import React, { useEffect, useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, ITectonicExplorerInteractiveState } from "../types";
import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, ITectonicExplorerInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, setInteractiveState }) => {
  const [ dataset, setDataset ] = useState<IDataset | null | undefined>();
  const [ planetViewSnapshot, setPlanetViewSnapshot ] = useState<string | undefined>();
  const [ crossSectionSnapshot, setCrossSectionSnapshot ] = useState<string | undefined>();
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");

  useEffect(() => {
    if (!dataSourceInteractive) {
      return;
    }

    const listener = (newLinkedIntState: ITectonicExplorerInteractiveState | undefined) => {
      const newDataset = newLinkedIntState && newLinkedIntState.dataset;
      const isValidDatasetVersion = newDataset && newDataset.type === "dataset" && Number(newDataset.version) === 1;

      // Accept null or undefined datasets too to clear them. If it's an object, make sure it follows specified format.
      if (!newDataset || isValidDatasetVersion) {
        setDataset(newDataset);
      } else if (newDataset && !isValidDatasetVersion) {
        console.warn(`Dataset version ${newDataset.version} is not supported`);
        setDataset(undefined);
      }

      setPlanetViewSnapshot(newLinkedIntState?.planetViewSnapshot);
      setCrossSectionSnapshot(newLinkedIntState?.crossSectionSnapshot);

      if (newLinkedIntState) {
        // Simply save linked state as our own interactive state. Currently, it's the only way to show anything in the report.
        // Reports don't support linked interactive state observing (yet?).
        setInteractiveState?.(prev => newLinkedIntState);
      }
    };
    const options = { interactiveItemId: dataSourceInteractive };
    addLinkedInteractiveStateListener<any>(listener, options);
    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive, setInteractiveState]);

  const decorateOptions = useGlossaryDecoration();
  return (
    <div className={css.tecRockTable}>
      {
        authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt} data-testid="legend">
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren>
      }
      <div className={css.tableAndSnapshots}>
        <div className={css.table}>
          <table>
            <thead>
              <tr><th>Rock</th><th>Temperature</th><th>Pressure</th></tr>
            </thead>
            <tbody>
              {
                dataset?.rows.map(row => (
                  <tr key={row[0]}>
                    { row.slice(1).map((value, idx) => (<td key={idx}>{ value }</td>)) }
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className={css.snapshots}>
          { planetViewSnapshot && <img src={planetViewSnapshot} alt="Planet view snapshot" /> }
          { crossSectionSnapshot && <img src={crossSectionSnapshot} alt="Cross-section snapshot" /> }
        </div>
      </div>
    </div>
  );
};
