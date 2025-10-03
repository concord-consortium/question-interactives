import React from "react";

import css from "./custom-block-form-option-list.scss";

interface IOption {
  label: string;
  value: string;
}

interface IProps {
  addButtonText?: string;
  dataTestIdPrefix?: string;
  labelPlaceholder?: string;
  options: IOption[];
  removeButtonText?: string;
  valuePlaceholder?: string;
  onOptionsChange: (options: IOption[]) => void;
}

export const CustomBlockFormOptionList: React.FC<IProps> = ({
  addButtonText = "Add Option",
  dataTestIdPrefix = "option",
  labelPlaceholder = "Display text (e.g., blue)",
  options,
  valuePlaceholder = "Value (e.g., BLUE)",
  removeButtonText = "Remove",
  onOptionsChange
}) => {
  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const newOptions = options.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    );
    onOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onOptionsChange(newOptions);
  };

  const addOption = () => {
    const newOptions = [...options, { label: "", value: "" }];
    onOptionsChange(newOptions);
  };

  return (
    <div className={css.optionList}>
      {options.map((option, index) => (
        <div key={index} className={css.optionRow} data-testid={`${dataTestIdPrefix}-row-${index}`}>
          <input
            data-testid={`${dataTestIdPrefix}-label-${index}`}
            placeholder={labelPlaceholder}
            type="text"
            value={option.label}
            onChange={(e) => updateOption(index, "label", e.target.value)}
          />
          <input
            data-testid={`${dataTestIdPrefix}-value-${index}`}
            placeholder={valuePlaceholder}
            type="text"
            value={option.value}
            onChange={(e) => updateOption(index, "value", e.target.value)}
          />
          <button
            className={css.removeOptionButton}
            data-testid={`remove-${dataTestIdPrefix}-${index}`}
            type="button"
            onClick={() => removeOption(index)}
          >
            {removeButtonText}
          </button>
        </div>
      ))}
      <button
        className={css.addOptionButton}
        data-testid={`add-${dataTestIdPrefix}`}
        type="button"
        onClick={addOption}
      >
        {addButtonText}
      </button>
    </div>
  );
};
