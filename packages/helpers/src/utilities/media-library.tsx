import React from "react";

type ExportToMediaLibraryAuthoringPropsOptions = {url: string, type: "image", caption: string|boolean}

export const ExportToMediaLibraryWidget = (props: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.checked);

  return (
    <div className="checkbox">
      <label>
        <input type="checkbox" id={props.id} checked={!!props.value} onChange={handleChange} />
        <span>Export to Media Library</span>
      </label>
    </div>
  );
};

export const exportToMediaLibraryAuthoringProps = (options: ExportToMediaLibraryAuthoringPropsOptions) => {
  const {url, type, caption} = options;

  const schemaProperties: any = {
    exportToMediaLibrary: {
      title: "Media Library",
      type: "boolean"
    },
    exportToMediaLibraryType: {
      type: "string",
      default: type,
    },
    exportToMediaLibraryUrlField: {
      type: "string",
      default: url,
    },
  };

  const uiSchema: any = {
    exportToMediaLibrary: {
      "ui:widget": ExportToMediaLibraryWidget,
      "ui:help": "Check this option to allow students to select this image in interactives that support image upload",
    },
    exportToMediaLibraryType: {
      "ui:widget": "hidden"
    },
    exportToMediaLibraryUrlField: {
      "ui:widget": "hidden"
    },
  };

  const uiOrder = ["exportToMediaLibrary", "exportToMediaLibraryType", "exportToMediaLibraryUrlField"];

  if (caption) {
    schemaProperties.exportToMediaLibraryCaptionField = {
      type: "string",
      default: caption,
    };
    uiSchema.exportToMediaLibraryCaptionField = {
      "ui:widget": "hidden"
    };
    uiOrder.push("exportToMediaLibraryCaptionField");
  }

  return {schemaProperties, uiSchema, uiOrder};
};
