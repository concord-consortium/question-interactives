import React, { useEffect, useMemo, useRef, useState } from "react";
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

interface IMenuItem {
  id: Exclude<FileModal, undefined>;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  disabled: boolean;
}

// Per-instance menu id without pulling in uuid (not a declared blockly dep).
// React 17 has no useId; a module counter gives stable unique ids so multiple
// Blockly instances on a page never collide.
let menuInstanceCount = 0;

export const Header: React.FC<IProps> = (props) => {
  const { savedStates, onShowFileModal } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);           // wrapper: button + menu
  const fileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const menuId = useMemo(() => `blockly-file-menu-${++menuInstanceCount}`, []);
  const hasSavedStates = savedStates.length > 1;

  const items: IMenuItem[] = [
    { id: "new",    label: "New",         Icon: NewModelIcon,    disabled: false },
    { id: "open",   label: "Open",        Icon: OpenModelIcon,   disabled: !hasSavedStates },
    { id: "copy",   label: "Make a copy", Icon: CopyModelIcon,   disabled: false },
    { id: "rename", label: "Rename",      Icon: RenameModelIcon, disabled: false },
    { id: "delete", label: "Delete",      Icon: DeleteModelIcon, disabled: false },
  ];

  const openMenu = (index: number) => {
    setActiveIndex(index);
    setShowMenu(true);
  };

  const activateItem = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    // Return focus to the File button before the menu (and this item) unmount,
    // so the dialog opened in response captures it and restores focus there on
    // close (QI-158).
    fileMenuButtonRef.current?.focus();
    setShowMenu(false);
    onShowFileModal(item.id);
  };

  // Roving tabindex: move DOM focus to the active item while the menu is open.
  useEffect(() => {
    if (showMenu) itemRefs.current[activeIndex]?.focus();
  }, [showMenu, activeIndex]);

  // Close on an outside mousedown (replaces the old transparent backdrop). The
  // button lives inside menuRef, so its own onClick owns toggling; this listener
  // only fires for clicks outside the wrapper.
  useEffect(() => {
    if (!showMenu) return;
    const handleDocMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [showMenu]);

  const handleButtonClick = () => {
    if (showMenu) {
      setShowMenu(false);
    } else {
      openMenu(0);
    }
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    // Enter/Space are intentionally NOT handled here: the native button already
    // synthesizes a click for them, which handleButtonClick turns into an open.
    // Handling them here too would open then immediately toggle closed.
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openMenu(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(items.length - 1);
    }
  };

  const renderMenu = () => (
    <div
      id={menuId}
      className={css.fileMenu}
      role="menu"
      aria-label="File menu"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.id === "rename" && <div className={css.fileMenuSeparator} />}
          <div
            ref={el => { itemRefs.current[index] = el; }}
            className={classNames(css.fileMenuItem, { [css.disabled]: item.disabled })}
            role="menuitem"
            tabIndex={index === activeIndex ? 0 : -1}
            aria-disabled={item.disabled || undefined}
            onClick={() => activateItem(index)}
          >
            <item.Icon /> {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={css.header}>
      <div className={css.fileMenuWrapper} ref={menuRef}>
        <button
          ref={fileMenuButtonRef}
          type="button"
          className={classNames(css.fileMenuButton, { [css.active]: showMenu })}
          onClick={handleButtonClick}
          onKeyDown={handleButtonKeyDown}
          aria-expanded={showMenu}
          aria-haspopup="menu"
          aria-controls={showMenu ? menuId : undefined}
          aria-label="File menu"
        >
          File
          <ArrowIcon className={classNames(css.arrowIcon, { [css.rotated]: showMenu })} />
        </button>
        {showMenu && renderMenu()}
      </div>
      <div className={css.separator} />
      <div className={css.name}><ModelIcon /> {props.name}</div>
    </div>
  );
};
