import React, { useEffect, useState } from "react";
import { IAuthoredState } from "./types";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "../../shared/hooks/use-linked-interactive-id";

import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
}

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const [ dataset, setDataset ] = useState<IDataset | null | undefined>();
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");

  useEffect(() => {
    if (!dataSourceInteractive) {
      return;
    }

    const listener = (newLinkedIntState: IInteractiveStateWithDataset | undefined) => {
      const newDataset = newLinkedIntState && newLinkedIntState.dataset;
      const isValidDatasetVersion = newDataset && newDataset.type === "dataset" && Number(newDataset.version) === 1;

      // Accept null or undefined datasets too to clear them. If it's an object, make sure it follows specified format.
      if (!newDataset || isValidDatasetVersion) {
        setDataset(newDataset);
      } else if (newDataset && !isValidDatasetVersion) {
        console.warn(`Dataset version ${newDataset.version} is not supported`);
        setDataset(undefined);
      }
    };
    const options = { interactiveItemId: dataSourceInteractive };
    addLinkedInteractiveStateListener<any>(listener, options);
    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive]);

  return (
    <div className={css.tecRockTable}>
      <table>
        <tbody>
          <tr><th>Rock</th><th>Temperature</th><th>Pressure</th></tr>
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
  );
};
