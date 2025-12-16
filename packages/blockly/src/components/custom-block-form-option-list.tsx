import React, { useEffect } from "react";

import css from "./custom-block-form-option-list.scss";

interface IOption {
  label: string;
  value: string;
}

interface IProps {
  addButtonText?: string;
  dataTestIdPrefix?: string;
  defaultOptionValue?: string;
  labelPlaceholder?: string;
  options: IOption[];
  removeButtonText?: string;
  valuePlaceholder?: string;
  onDefaultChange?: (value?: string) => void;
  onOptionsChange: (options: IOption[]) => void;
}

export const CustomBlockFormOptionList: React.FC<IProps> = ({
  addButtonText = "Add Option",
  dataTestIdPrefix = "option",
  defaultOptionValue,
  labelPlaceholder = "Display text (e.g., blue)",
  options,
  valuePlaceholder = "Value (e.g., BLUE)",
  removeButtonText = "Remove",
  onDefaultChange,
  onOptionsChange
}) => {
  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const newOptions = options.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    );
    onOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    const removed = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    onOptionsChange(newOptions);
    if (removed && onDefaultChange && removed.value === defaultOptionValue) {
      onDefaultChange(undefined);
    }
  };

  const addOption = () => {
    const newOptions = [...options, { label: "", value: "" }];
    onOptionsChange(newOptions);
  };

  // If no valid default is set, automatically pick the first non-empty option value.
  useEffect(() => {
    if (!onDefaultChange) return;
    const hasDefault = defaultOptionValue !== undefined && options.some(o => o.value && o.value === defaultOptionValue);
    if (hasDefault) return;
    const firstNonEmpty = options.find(o => o.value && o.value.trim() !== "");
    if (firstNonEmpty) {
      onDefaultChange(firstNonEmpty.value);
    } else {
      onDefaultChange(undefined);
    }
    // We only want to react to options changes and defaultOptionValue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, defaultOptionValue]);

  return (
    <div className={css.optionList}>
      <div className={css.optionHeader}>
        <div className={css.defaultHeader} data-testid="default-header">Default</div>
      </div>
      {options.map((option, index) => (
        <div key={index} className={css.optionRow} data-testid={`${dataTestIdPrefix}-row-${index}`}>
          <div className={css.defaultRadio}>
            <input
              aria-label={`Set ${option.label || option.value || `option ${index + 1}`} as default`}
              checked={defaultOptionValue === option.value}
              data-testid={`default-${dataTestIdPrefix}-${index}`}
              name={`default-${dataTestIdPrefix}`}
              type="radio"
              onChange={() => onDefaultChange && onDefaultChange(option.value)}
            />
          </div>
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
