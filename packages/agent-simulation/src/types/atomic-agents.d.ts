// src/types/atomic-agents.d.ts
declare module "@gjmcn/atomic-agents" {
  /* ===== Core containers ===== */
  export interface SimulationInit {
    // shape is flexible; library is JS-first
    width?: number;
    height?: number;
    tickDurationMs?: number;
    seed?: number;
    [key: string]: any;
  }

  export class Simulation {
    constructor(init?: SimulationInit);
    /** advance one tick (a single update step) */
    step(): void;
    /** start advancing automatically (if supported by your runner) */
    start(): void;
    /** stop automatic advancement */
    stop(): void;
    /** reset to initial state (if implemented in your setup) */
    reset(): void;

    time: number;           // tick counter / time value
    running?: boolean;
    // common containers you’ll likely poke at:
    actors?: XSet<Actor>;
    grid?: Grid;
    zones?: Zone[];
    [key: string]: any;
  }

  /* ===== Agents & world ===== */
  export class Actor {
    id?: number;
    x: number;
    y: number;
    r?: number;             // radius
    heading?: number;       // degrees or radians depending on your model
    speed?: number;
    vx?: number;
    vy?: number;
    step?(): void;          // per-tick behavior you define
    [key: string]: any;
  }

  export class Grid {
    width: number;
    height: number;
    cols?: number;
    rows?: number;
    size?: number;          // patch size
    // convenience accessors vary by model; keep open
    [key: string]: any;
  }

  export class Zone {
    id?: number;
    squares?: number[];
    [key: string]: any;
  }

  export class Vector {
    static randomAngle(x: number): number;
    x: number;
    y: number;
    clone(): Vector;
    add(v: Vector): Vector;
    sub(v: Vector): Vector;
    scale(n: number): Vector;
    norm(): number;
    [key: string]: any;
  }

  /* ===== Data structures ===== */
  export class XSet<T> extends Set<T> {
    toArray(): T[];
    map<U>(fn: (t: T) => U): U[];
    filter(fn: (t: T) => boolean): XSet<T>;
    [key: string]: any;
  }

  /* ===== Utilities (partial but useful) ===== */
  export const helpers: {
    clamp(n: number, min: number, max: number): number;
    dist(x1: number, y1: number, x2: number, y2: number): number;
    // add more as you use them; safe catch-all prevents blocking
    [key: string]: any;
  };

  export const random: {
    randomInt(max: number): number;
    choice<T>(arr: T[]): T;
    normal(mean?: number, sd?: number): number;
    seed?(n: number): void;
    [key: string]: any;
  };

  /* ===== Geometry & helpers (typed as any for now) ===== */
  export const within: any;
  export const overlap: any;
  export const boundaryDistance: any;
  export const centroidDistance: any;
  export const centroidWithin: any;
  export const insideDistance: any;
  export const randomCircles: any;
  export const simplify: any;
  export const polyline: any;
  export const regions: any;
  export const fromFunctions: any;

  /* ===== Namespace-style default for convenience ===== */
  const AA: {
    Simulation: typeof Simulation;
    Actor: typeof Actor;
    Grid: typeof Grid;
    Zone: typeof Zone;
    Vector: typeof Vector;
    XSet: typeof XSet;
    helpers: typeof helpers;
    random: typeof random;
    within: any; overlap: any; boundaryDistance: any; centroidDistance: any;
    centroidWithin: any; insideDistance: any; randomCircles: any; simplify: any;
    polyline: any; regions: any; fromFunctions: any;
    [key: string]: any;
  };
  export default AA;
}
