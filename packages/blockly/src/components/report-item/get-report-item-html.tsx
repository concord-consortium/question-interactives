import { IAuthoredState, IInteractiveState } from "../types";
import { inject, serialization } from "blockly";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState: IInteractiveState;
}

// Cache for preventing repeated re-rendering of the same content.
const htmlCache = new Map<string, string>();

export const getReportItemHtml = ({ interactiveState, authoredState }: IProps) => {
  const { blocklyState } = interactiveState;
  const { toolbox } = authoredState;
  if (!blocklyState || !toolbox) return "";

  const HEIGHT = 200;
  const TALL_WIDTH = 368;
  const WIDE_WIDTH = 400;
  const cacheKey = stableHash(`v1|${blocklyState}|${toolbox}|${WIDE_WIDTH}x${HEIGHT}|${TALL_WIDTH}x${HEIGHT}`);
  const cached = htmlCache.get(cacheKey);
  if (cached) return cached;

  const blocklyStateJson = JSON.parse(blocklyState);

  function buildStaticHtml(prefix: string, width: number, height: number) {
    const tempDiv = document.createElement("div");
    tempDiv.style.width = `${width}px`;
    tempDiv.style.height = `${height}px`;
    tempDiv.style.position = "relative";

    const workspace = inject(tempDiv, {
      readOnly: true,
      toolbox: JSON.parse(toolbox),
      trashcan: false,
      scrollbars: false,
      zoom: { controls: false, wheel: false, startScale: 0.4, minScale: 0.4, maxScale: 0.4, scaleSpeed: 1 },
      media: "https://unpkg.com/blockly/media/",
    });

    serialization.workspaces.load(blocklyStateJson, workspace);
    workspace.render();

    const rawHtml = tempDiv.innerHTML;
    workspace.dispose();

    // Normalize IDs so output is the same across renders
    const normalizedHtml = normalizeBlocklyIds(rawHtml, prefix);

    return normalizedHtml;
  }

  try {
    const tallHtml = buildStaticHtml("tall", TALL_WIDTH, HEIGHT);
    const wideHtml = buildStaticHtml("wide", WIDE_WIDTH, HEIGHT);

    const result = `
      <style>
        .tall { border: 1px solid #ccc; height: ${HEIGHT}px; width: ${TALL_WIDTH}px; }
        .wide { border: 1px solid #ccc; height: ${HEIGHT}px; margin-top: 12px; width: ${WIDE_WIDTH}px; }
      </style>
      <div class="tall">${tallHtml}</div>
      <div class="wide">${wideHtml}</div>
    `;

    htmlCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    return `<div>Error: ${error.message}</div>`;
  }
};

// FNV-1a 32-bit hash constants
const FNV_OFFSET_BASIS = 2166136261 >>> 0;
const FNV_PRIME = 16777619;

// Generates a stable hash for cache keys.
function stableHash(s: string) {
  let h = FNV_OFFSET_BASIS;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h.toString(36);
}

// Replaces all auto-generated Blockly IDs with stable ones and fixes references.
function normalizeBlocklyIds(svgHtml: string, prefix: string) {
  const idRegex = /id="([^"]+)"/g;
  const seen = new Map<string, string>();
  let counter = 0;

  svgHtml.replace(idRegex, (_m, id) => {
    if (!seen.has(id)) {
      if (/^blockly/i.test(id)) {
        seen.set(id, `${prefix}-id${counter++}`);
      } else {
        seen.set(id, id);
      }
    }
    return "";
  });

  const swap = (orig: string) => seen.get(orig) ?? orig;

  svgHtml = svgHtml.replace(idRegex, (_m, id) => `id="${swap(id)}"`);
  svgHtml = svgHtml.replace(/url\(#([^)]+)\)/g, (_m, id) => `url(#${swap(id)})`);
  svgHtml = svgHtml.replace(/(xlink:href|href)="#([^"]+)"/g, (_m, attr, id) => `${attr}="#${swap(id)}"`);

  return svgHtml;
}
