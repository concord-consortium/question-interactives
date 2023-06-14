import React from "react";

type ExportToMediaLibraryAuthoringPropsOptions = {
  exportLabel: string;
  url: string;
  type: "image";
  caption: string|boolean;
  addAllowUpload?: boolean;
}

export const ExportToMediaLibraryWidget = (props: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.checked);

  return (
    <div className="checkbox">
      <label>
        <input type="checkbox" id={props.id} checked={!!props.value} onChange={handleChange} />
        <span>{props.schema.customLabel}</span>
      </label>
    </div>
  );
};

export const AllowUploadFromMediaLibraryWidget = (props: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.checked);

  return (
    <div className="checkbox">
      <label>
        <input type="checkbox" id={props.id} checked={!!props.value} onChange={handleChange} />
        <span>Allow Student to Upload from Media Library</span>
      </label>
    </div>
  );
};

export const exportToMediaLibraryAuthoringProps = (options: ExportToMediaLibraryAuthoringPropsOptions) => {
  const {exportLabel, url, type, caption, addAllowUpload} = options;

  const schemaProperties: any = {
    exportToMediaLibrary: {
      title: "Export To Media Library",
      customLabel: `Export ${exportLabel} To Media Library`,
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

  if (addAllowUpload) {
    schemaProperties.allowUploadFromMediaLibrary = {
      title: "Upload From Media Library",
      type: "boolean"
    };
    uiSchema.allowUploadFromMediaLibrary ={
      "ui:widget": AllowUploadFromMediaLibraryWidget,
      "ui:help": "Check this option to allow students to upload images from this activity's Media Library",
    };
    uiOrder.push("allowUploadFromMediaLibrary");
  }

  return {schemaProperties, uiSchema, uiOrder};
};
