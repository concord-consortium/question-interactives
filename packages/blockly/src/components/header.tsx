import React, { useState, useRef } from "react";
import classNames from "classnames";

import { ISavedBlocklyState } from "./types";

import ArrowIcon from "../assets/arrow-icon.svg";
import ModelIcon from "../assets/model-icon.svg";
import NewModelIcon from "../assets/new-model-icon.svg";
import OpenModelIcon from "../assets/open-model-icon.svg";
import CopyModelIcon from "../assets/copy-model-icon.svg";
import RenameModelIcon from "../assets/rename-model-icon.svg";
import DeleteModelIcon from "../assets/delete-model-icon.svg";

import css from "./header.scss";

interface IProps {
  name: string;
  savedStates: ISavedBlocklyState[];
  onShowFileModal: (fileModal: FileModal) => void;
}

export const fileModals = ["new", "open", "copy", "rename", "delete"] as const;
export type FileModal = typeof fileModals[number] | undefined;

export const Header: React.FC<IProps> = (props) => {
  const {savedStates, onShowFileModal} = props;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const hasSavedStates = savedStates.length > 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the click event from firing
    setShowMenu(prev => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleShowFileModal = (fileModal: FileModal) => () => {
    // Return focus to the persistent File menu button before the menu (and the
    // activating menu item) unmount. The dialog the parent renders in response
    // captures this element as the previously focused one and restores focus to
    // it on close; without this, focus would fall to <body> when the item unmounts.
    fileMenuButtonRef.current?.focus();
    setShowMenu(false);
    onShowFileModal(fileModal);
  };

  const renderMenu = () => {
    return (
      <div className={css.fileMenu} role="menu" aria-label="File menu">
        <div className={css.fileMenuItem} onClick={handleShowFileModal("new")} role="menuitem" tabIndex={0}>
          <NewModelIcon /> New
        </div>
        <div className={classNames(css.fileMenuItem, {[css.disabled]: !hasSavedStates})} onClick={handleShowFileModal("open")} role="menuitem" tabIndex={hasSavedStates ? 0 : -1} aria-disabled={!hasSavedStates}>
          <OpenModelIcon />
          Open
        </div>
        <div className={css.fileMenuItem} onClick={handleShowFileModal("copy")} role="menuitem" tabIndex={0}>
          <CopyModelIcon /> Make a copy
        </div>
        <div className={css.fileMenuSeparator} />
        <div className={css.fileMenuItem} onClick={handleShowFileModal("rename")} role="menuitem" tabIndex={0}>
          <RenameModelIcon /> Rename
        </div>
        <div className={css.fileMenuItem} onClick={handleShowFileModal("delete")} role="menuitem" tabIndex={0}>
          <DeleteModelIcon /> Delete
        </div>
      </div>
    );
  };

  return (
    <div className={css.header}>
      {showMenu && <div className={css.backdrop} onMouseDown={handleCloseMenu} />}
      <div className={css.fileMenuWrapper} ref={menuRef}>
        <button
          ref={fileMenuButtonRef}
          className={classNames(css.fileMenuButton, {[css.active]: showMenu})}
          onMouseDown={handleMouseDown}
          aria-expanded={showMenu}
          aria-haspopup="menu"
          aria-label="File menu"
        >
          File
          <ArrowIcon className={classNames(css.arrowIcon, {[css.rotated]: showMenu})} />
        </button>
        {showMenu && renderMenu()}
      </div>
      <div className={css.separator} />
      <div className={css.name}><ModelIcon /> {props.name}</div>
    </div>
  );
};
