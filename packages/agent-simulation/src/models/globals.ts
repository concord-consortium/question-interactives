import { makeAutoObservable } from "mobx";

import { GlobalValue } from "../types/globals";

export class Globals {
  private globals: Record<string, GlobalValue> = {};

  constructor() {
    makeAutoObservable(this);
  }

  get(key: string) {
    return this.globals[key];
  }

  set(key: string, value: GlobalValue) {
    this.globals[key] = value;
  }
}
