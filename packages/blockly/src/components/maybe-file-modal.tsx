import React, { useRef } from "react";
import { Modal } from "@concord-consortium/question-interactives-helpers/src/components/modal";

import { ISavedBlocklyState } from "./types";
import { FileModal } from "./header";

import NewModelIcon from "../assets/new-model-icon.svg";
import OpenModelIcon from "../assets/open-model-icon.svg";
import CopyModelIcon from "../assets/copy-model-icon.svg";
import RenameModelIcon from "../assets/rename-model-icon.svg";
import DeleteModelIcon from "../assets/delete-model-icon.svg";

import css from "./maybe-file-modal.scss";

interface IProps {
  fileModal: FileModal;
  setFileModal: React.Dispatch<React.SetStateAction<FileModal>>;
  savedBlocklyStates: ISavedBlocklyState[];
  handleFileNew: (newName: string) => boolean;
  handleFileOpen: (selectedName: string) => boolean;
  handleFileCopy: (newName: string) => boolean;
  handleFileRename: (newName: string) => boolean;
  handleFileDelete: () => void;
  name: string;
}

export const MaybeFileModal: React.FC<IProps> = ({ fileModal, setFileModal, savedBlocklyStates, handleFileNew, handleFileOpen, handleFileCopy, handleFileRename, handleFileDelete, name }) => {
  const modelNames = Array.from(new Set([...savedBlocklyStates.map(s => s.name), name]));
  const modelNameRef = useRef<HTMLInputElement | null>(null);
  const modelSelectRef = useRef<HTMLSelectElement | null>(null);

  if (!fileModal) {
    return null;
  }

  const handleCancel = () => setFileModal(undefined);
  const handleClose = () => setFileModal(undefined);

  if (fileModal === "new") {
    const modelNums = modelNames
      .filter(modelName => /^model\s+\d+$/i.test(modelName))
      .map(modelName => {
        const match = modelName.match(/(\d+)$/);
        const num = match ? parseInt(match[1], 10) : null;
        return num !== null && !isNaN(num) ? num : null;
      })
      .filter(num => num !== null) as number[];
    const nextModelNum = (modelNums.length > 0 ? Math.max(...modelNums) : 0) + 1;

    return <Modal
      variant="teal"
      title="New Model"
      Icon={NewModelIcon}
      message={
        <div className={css.modalForm}>
          <div>Name your new model:</div>
          <div className={css.modalInputGroup}>
            <label htmlFor="model-name-input">Model Name</label>
            <input type="text" id="model-name-input" data-testid="model-name-input" defaultValue={`Model ${nextModelNum}`} ref={modelNameRef} />
          </div>
        </div>
      }
      confirmLabel="Save"
      onConfirm={() => {
        const newName = modelNameRef.current?.value?.trim() ?? "";
        if (handleFileNew(newName)) {
          handleClose();
        }
      }}
      onCancel={handleCancel}
    />;
  }

  if (fileModal === "open") {
    const otherModelNames = modelNames.filter(modelName => modelName !== name);
    const options = otherModelNames.map((modelName, index) => (
      <option key={index} value={modelName}>{modelName}</option>
    ));
    return <Modal
      variant="teal"
      title="Open Model"
      Icon={OpenModelIcon}
      message={
        <div className={css.modalForm}>
          <div>Select a model to open:</div>
          <div className={css.modalInputGroup}>
            <label htmlFor="model-select">Model Name</label>
            <select id="model-select" data-testid="model-select" ref={modelSelectRef}>
              {options}
            </select>
          </div>
        </div>
      }
      confirmLabel="Open"
      onConfirm={() => {
        const selectedName = modelSelectRef.current?.value ?? "";
        if (handleFileOpen(selectedName)) {
          handleClose();
        }
      }}
      onCancel={handleCancel}
    />;
  }

  if (fileModal === "copy") {
    return <Modal
      variant="teal"
      title="Make a Copy"
      Icon={CopyModelIcon}
      message={
        <div className={css.modalForm}>
          <div>Create a copy of the model:</div>
          <div className={css.modalInputGroup}>
            <label htmlFor="model-name-input">Model Name</label>
            <input type="text" id="model-name-input" data-testid="model-name-input" defaultValue={`Copy of ${name}`} ref={modelNameRef} />
          </div>
        </div>
      }
      confirmLabel="Save"
      onConfirm={() => {
        const newName = modelNameRef.current?.value?.trim() ?? "";
        if (handleFileCopy(newName)) {
          handleClose();
        }
      }}
      onCancel={handleCancel}
    />;
  }

  if (fileModal === "rename") {
    return <Modal
      variant="teal"
      title="Rename Model"
      Icon={RenameModelIcon}
      message={
        <div className={css.modalForm}>
          <div>Edit the name of your model:</div>
          <div className={css.modalInputGroup}>
            <label htmlFor="model-name-input">Model Name</label>
            <input type="text" id="model-name-input" data-testid="model-name-input" defaultValue={name} ref={modelNameRef} />
          </div>
        </div>
      }
      confirmLabel="Save"
      onConfirm={() => {
        const newName = modelNameRef.current?.value?.trim() ?? "";
        if (handleFileRename(newName)) {
          handleClose();
        }
      }}
      onCancel={handleCancel}
    />;
  }

  if (fileModal === "delete") {
    return <Modal
      variant="teal"
      title="Delete Model"
      Icon={DeleteModelIcon}
      message={<div>Are you sure you want to delete <span style={{fontWeight: "bold"}}>{name}</span>?</div>}
      confirmLabel="Delete"
      onConfirm={() => {
        handleFileDelete();
        handleClose();
      }}
      onCancel={handleCancel}
    />;
  }

  return null;
};
