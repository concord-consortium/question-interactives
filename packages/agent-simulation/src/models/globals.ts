import { makeAutoObservable } from "mobx";

import { Global } from "../types/globals";

export class Globals {
  private globals: Record<string, Global> = {};

  constructor() {
    makeAutoObservable(this);
  }

  createGlobal(key: string, global: Global) {
    if (!this.globals[key])  this.globals[key] = global;
  }

  getDisplayName(key: string) {
    return this.getGlobal(key)?.displayName;
  }

  getGlobal(key: string) {
    return this.globals[key];
  }

  getValue(key: string) {
    return this.getGlobal(key)?.value;
  }

  setValue(key: string, value: any) {
    const global = this.getGlobal(key);
    if (global) global.value = value;
  }
}