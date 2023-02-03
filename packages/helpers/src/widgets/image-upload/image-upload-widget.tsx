import { TokenServiceClient } from "@concord-consortium/token-service";
import React, { ChangeEvent, useCallback, useState } from "react";
import { WidgetProps } from "@rjsf/utils";
import { IFormContext } from "../../components/base-authoring";
import { useDropzone } from "react-dropzone";
import { s3Upload, uniqueFilename } from "../../utilities/s3-upload";
import { getOrCreateUserImageUploadResource } from "../../utilities/token-service";

import css from "./image-upload-widget.scss";

export const ImageUploadDropzone = ({onDrop}: {onDrop: (file: File) => void}) => {
  const handleDrop = useCallback((files) => {
    if (files.length > 0) {
      onDrop(files[0]);
    }
  }, [onDrop]);

  const {getRootProps, getInputProps, fileRejections} = useDropzone({
    onDrop: handleDrop,
    accept: "image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
  });

  const rejectedFileMessage = fileRejections.length > 0 ? <p>{`Sorry, ${fileRejections[0].file.name} can't be uploaded. Please use one of the supported file types.`}</p> : undefined;

  return (
    <div className={css.dropzone} {...getRootProps()}>
      <input {...getInputProps()} />
      Drop an image here, or click to select a file to upload. Only popular image formats are supported (e.g. png, jpeg, gif, svg, webp).
      {rejectedFileMessage}
    </div>
  );
};

type UploadStatusState = "waiting" | "uploading" | "uploaded" | "error";

interface ImageUploadComponentProps {
  id?: string
  className?: string
  defaultValue?: string
  onChange: (value: string) => void
  tokenServiceClient: TokenServiceClient;
}

// used in carousel iframe-authoring directly as a React component and by widget
export const ImageUploadComponent = ({id, defaultValue, onChange, tokenServiceClient}: ImageUploadComponentProps) => {
  const [value, setValue] = useState(defaultValue || "");
  const [uploadStatus, setUploadStatus] = useState<UploadStatusState>("waiting");
  const [error, setError] = useState<string|undefined>();
  const [filename, setFilename] = useState<string|undefined>();

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [setValue, onChange]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    updateValue(event.target.value);
  }, [updateValue]);

  const handleDrop = useCallback(async (file: File) => {
    setError(undefined);
    setUploadStatus("uploading");
    setFilename(file.name);

    try {
      const s3Resource = await getOrCreateUserImageUploadResource(tokenServiceClient);
      const credentials = await tokenServiceClient.getCredentials(s3Resource.id);
      const url = await s3Upload({
        client: tokenServiceClient,
        resource: s3Resource,
        credentials,
        filename: uniqueFilename(file.name),
        body: file,
        contentType: file.type,
        cacheControl: "max-age=31536000" // 1 year
      });
      setUploadStatus("uploaded");
      updateValue(url);
    } catch (e) {
      console.error("Error uploading file", e);
      setUploadStatus("error");
      setError(e.toString());
    }
  }, [setUploadStatus, updateValue, tokenServiceClient]);

  return (
    <div className={css.customImageUploadWidget}>
      {tokenServiceClient && <ImageUploadDropzone onDrop={handleDrop} />}
      {uploadStatus === "uploading" && <div className={css.uploadProgress}>Uploading {filename}...</div>}
      {uploadStatus === "uploaded" && <div className={css.uploadProgress}>Uploaded {filename}!</div>}
      {uploadStatus === "error" && <div className={css.uploadError}>Error uploading {filename}! {error}</div>}
      <p>
        <input className="form-control" type="text" id={id} value={value} onChange={handleInputChange} />
      </p>
    </div>
  );
};

// used in json ui-schema in multiple question interactives
export const ImageUploadWidget = (props: WidgetProps) => {
  const { onChange } = props;
  const { tokenServiceClient } = props.formContext as IFormContext<unknown>;

  return <ImageUploadComponent id={props.id} onChange={onChange} defaultValue={props.value} tokenServiceClient={tokenServiceClient} />;
};
