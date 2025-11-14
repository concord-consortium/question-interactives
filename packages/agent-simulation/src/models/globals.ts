import { makeAutoObservable } from "mobx";

import { GlobalValue } from "../types/globals";

export class Globals {
  private globals: Record<string, GlobalValue> = {};

  constructor() {
    makeAutoObservable(this);
  }

  // Only creates a new global if it doesn't already exist
  create(key: string, value: GlobalValue) {
    if (this.globals[key] === undefined) this.globals[key] = value;
  }

  get(key: string) {
    return this.globals[key];
  }

  // Creates the global if it doesn't already exist
  set(key: string, value: GlobalValue) {
    this.globals[key] = value;
  }
}
