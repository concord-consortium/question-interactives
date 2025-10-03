import React from "react";

import css from "./custom-block-form-child-blocks.scss";

interface IProps {
  availableChildOptions: { id: string; name: string }[];
  childBlocks: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const CustomBlockFormChildBlocks = ({ availableChildOptions, childBlocks, onChange }: IProps) => {
  return (
    <div className={css.customBlockForm_childBlocks} data-testid="section-child-blocks">
      <label htmlFor="child-blocks">Child Blocks</label>
      <select
        id="child-blocks"
        multiple
        size={6}
        value={childBlocks}
        onChange={onChange}
      >
        {availableChildOptions.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
};
