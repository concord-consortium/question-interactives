# Full Screen Interactive - URL Default Values and Custom Parameters

**Repository:** https://github.com/concord-consortium/question-interactives/tree/master/packages/full-screen

**Status:** Implemented

**Jira Story:** [QI-107](https://concord-consortium.atlassian.net/browse/QI-107)

**Related Spec:** [Full Screen Interactive - CODAP Authoring Interface Specification](./fullscreen-authoring-interface.md)

## Overview

This specification adds support for two new URL parameter prefixes on the full-screen interactive's own URL (i.e., the `?wrappedInteractive=...&authoring=codap` URL). These prefixes allow external systems (e.g., LARA, Activity Player, or curriculum tools) to influence the authoring form's initial state without modifying the CODAP source document URL itself.

### Parameter Prefixes

| Prefix | Format | Purpose |
|--------|--------|---------|
| `default:` | `default:fieldName=value` | Provides a fallback value for a form field when no value already exists |
| `custom:` | `custom:key=value` | Adds a key/value pair to the CODAP custom URL parameters |

### Example URL

```
full-screen.html
  ?wrappedInteractive=https://codap.concord.org/app/static/dg/en/cert/index.html#shared=...
  &authoring=codap
  &default:displayFullscreenButton=false
  &default:removeToolbarsAndGrid=true
  &custom:foo=bar
  &custom:showAbout=true
```

## Problem Statement

Currently, the authoring form's initial state comes from one of three sources (as described in the [existing spec](./fullscreen-authoring-interface.md#how-wrappedinteractiveurl-and-url-parameters-work)):

1. Saved `authoringConfig.data` (previously saved form state)
2. Parsed from `wrappedInteractiveUrl` (editing existing interactive without saved config)
3. `codapInitialData` hardcoded defaults (brand new interactive)

There is no mechanism for external systems to supply default values or pre-populate custom parameters when creating new interactives. This means:

- Curriculum templates that want checkboxes pre-checked must embed those settings in the CODAP source URL itself, mixing authoring concerns into the content URL
- There is no way to supply custom parameters without the author manually entering them in the Advanced Options section

## Proposed Changes

### 1. Parse `default:` and `custom:` Parameters from the Full-Screen URL

When the full-screen interactive loads in authoring mode, `app.tsx` already parses `location.search` for `wrappedInteractive` and `authoring` parameters (see [existing spec §1. Authoring URL Parameter Support](./fullscreen-authoring-interface.md#1-authoring-url-parameter-support)). This feature adds parsing of any parameters with the `default:` or `custom:` prefix.

**Parsing logic (in `app.tsx` or a new utility):**

```typescript
interface IPrefixedParams {
  defaults: Record<string, string>;
  customs: Record<string, string>;
}

/**
 * Extract default: and custom: prefixed parameters from a URLSearchParams.
 *
 * @example
 * // URL: ?default:removeToolbarsAndGrid=true&custom:foo=bar
 * // Returns: { defaults: { removeToolbarsAndGrid: "true" }, customs: { foo: "bar" } }
 */
const parsePrefixedParams = (search: string): IPrefixedParams => {
  const params = new URLSearchParams(search);
  const defaults: Record<string, string> = {};
  const customs: Record<string, string> = {};

  params.forEach((value, key) => {
    if (key.startsWith("default:")) {
      const fieldName = key.slice("default:".length);
      if (fieldName) {
        defaults[fieldName] = value;
      }
    } else if (key.startsWith("custom:")) {
      const paramName = key.slice("custom:".length);
      if (paramName) {
        customs[paramName] = value;
      }
    }
  });

  return { defaults, customs };
};
```

### 2. Pass Prefixed Parameters to the Authoring Component

The parsed `defaults` and `customs` are passed from `app.tsx` through to the `Authoring` component as new props:

```typescript
interface IProps {
  authoredState: IAuthoredState;
  onAuthoredStateChange: (state: IAuthoredState) => void;
  authoringType: string;
  urlDefaults?: Record<string, string>;   // NEW
  urlCustoms?: Record<string, string>;    // NEW
}
```

These are parsed once at mount time and do not change during the session.

### 3. Apply `default:` Values as Form Fallbacks

`default:` parameters set the initial value of form fields **only when no existing value is present**. They act as overrides to the hardcoded `codapInitialData` defaults but are lower priority than saved or parsed data.

**Priority order (highest to lowest):**

1. Saved `authoringConfig.data` (previously saved form state — always wins)
2. Parsed from `wrappedInteractiveUrl` (existing interactive being edited)
3. **`default:` URL parameters** (NEW — template-provided defaults)
4. `codapInitialData` / `config.initialData` (hardcoded defaults)

**Implementation approach:**

The defaults are applied in the `formData` computation (`computedFormData` in `authoring.tsx`). When falling through to `config.initialData` (source #3 in the existing priority list), the URL defaults are merged on top:

```typescript
// In the formData useMemo, when using initialData:
const baseData = config.initialData;
const dataWithUrlDefaults = urlDefaults
  ? applyDefaults(baseData, urlDefaults, config.schema)
  : baseData;
data = dataWithUrlDefaults;
```

**Value coercion:**

URL parameters are always strings. The `applyDefaults` function coerces values based on the JSON Schema field type:

| Schema Type | Coercion | Example |
|-------------|----------|---------|
| `boolean` | `"true"` / `"1"` → `true`, anything else → `false` | `default:removeToolbarsAndGrid=true` |
| `integer` | `parseInt(value, 10)` — ignored if `NaN` | `default:advancedOptions.guideIndexValue=3` |
| `number` | `parseFloat(value)` — ignored if `NaN` | |
| `string` | Used as-is | `default:codapSourceDocumentUrl=https://...` |

**Nested field paths:**

Dot-separated paths target nested fields within the form data. For example, `default:advancedOptions.guideIndexValue=3` sets `formData.advancedOptions.guideIndexValue`.

**Ignored cases:**

- If the field path doesn't correspond to a field in the schema, the default is silently ignored (with a `console.warn`)
- If the value cannot be coerced to the schema type (e.g., `default:guideIndexValue=abc`), the default is silently ignored (with a `console.warn`)
- If saved data or parsed URL data already provides a value, the default is not applied

### 4. Apply `custom:` Values to Custom URL Parameters

`custom:` parameters are appended to the custom parameters textarea in the Advanced Options section. They are merged with any manually-entered custom parameters.

**Behavior:**

- `custom:` parameters are added to `advancedOptions.customParamsValue` as additional lines
- If `customParamsValue` already contains a key matching a `custom:` parameter, the existing value takes precedence (author's manual entry wins)
- The `enableCustomParams` checkbox is automatically set to `true` if any `custom:` parameters are present
- `custom:` parameters are applied at the same point as `default:` values — only when initializing from `config.initialData` (new interactive)

**Example:**

Given URL: `?custom:foo=bar&custom:baz=qux`

The effect on a new interactive's form data:
```typescript
{
  advancedOptions: {
    enableCustomParams: true,
    customParamsValue: "foo=bar\nbaz=qux"
    // ...other fields
  }
}
```

If the author already has saved data with `customParamsValue: "foo=override&myParam=123"`, the `custom:` params are not applied (saved data takes priority per §3 priority order).

### 5. Initial Sync Behavior

The existing initial sync logic in `authoring.tsx` (the `useEffect` that runs on mount to sync form data to authored state) continues to work unchanged. When `default:` or `custom:` values are applied to the initial form data, they flow through the normal sync path and get saved to `authoringConfig.data` on the first save.

After the first save, the `default:` and `custom:` values have no further effect — the saved `authoringConfig.data` takes full precedence on subsequent loads.

## Scope

### In Scope

- Parsing `default:` and `custom:` prefixed parameters from the full-screen interactive URL
- Applying defaults as fallback values when no saved/parsed data exists
- Merging custom parameters into the custom params textarea
- Value coercion from string to the appropriate schema type
- Console warnings for invalid field paths or un-coercible values

### Out of Scope

- Runtime behavior changes (these parameters only affect authoring mode)
- Changes to the CODAP URL building logic (`buildCodapUrl`)
- Validation of `default:` values beyond type coercion (schema validation handles this)
- Persisting the URL defaults after initial application (they become regular form data)
- ~~Support for `default:` parameters in the generic authoring config~~ — `default:` is schema-driven and works for any config

## Acceptance Criteria

### `default:` Parameters

- [x] `default:fieldName=value` sets the form field's initial value when no saved data exists
- [x] Boolean fields accept `true`/`false` and `1`/`0` string values
- [x] Integer fields accept numeric string values
- [x] String fields accept any string value
- [x] Nested fields work with dot notation (e.g., `default:advancedOptions.enableDi=true`)
- [x] Defaults are NOT applied when saved `authoringConfig.data` exists
- [x] Defaults are NOT applied when form data is parsed from an existing `wrappedInteractiveUrl`
- [x] Invalid field paths produce a `console.warn` and are otherwise ignored
- [x] Un-coercible values (e.g., `default:guideIndexValue=abc`) produce a `console.warn` and are ignored
- [x] Multiple `default:` parameters can be combined in a single URL

### `custom:` Parameters

- [x] `custom:key=value` adds the key/value pair to `advancedOptions.customParamsValue`
- [x] `enableCustomParams` is automatically set to `true` when `custom:` parameters are present
- [x] Multiple `custom:` parameters are joined with newlines in the textarea
- [x] `custom:` parameters are NOT applied when saved `authoringConfig.data` exists
- [x] Existing manually-entered custom params take precedence over `custom:` params with the same key

### Integration

- [x] Parameters are parsed once from `location.search` at mount time
- [x] After the first save, defaults and customs have no further effect (saved data takes over)
- [x] No changes to runtime behavior — only authoring mode is affected

### Edge Cases

- [x] URL with only `default:` params (no `custom:`) works correctly
- [x] URL with only `custom:` params (no `default:`) works correctly
- [x] Empty values (e.g., `default:codapSourceDocumentUrl=`) set the field to an empty string
- [x] Parameters with no value after the prefix (e.g., `default:=value`, `custom:=value`) are ignored
- [x] URL-encoded values are correctly decoded (handled by `URLSearchParams`)

## Example Use Cases

### Use Case 1: Curriculum Template with Pre-configured Defaults

A curriculum system wants all new CODAP interactives to have toolbars removed and components locked by default:

```
full-screen.html
  ?wrappedInteractive=https://codap.concord.org/...
  &authoring=codap
  &default:removeToolbarsAndGrid=true
  &default:lockComponents=true
```

The author opens the form and sees "Remove toolbars & background grid" and "Lock components" already checked, rather than having to manually check them each time.

### Use Case 2: Injecting Custom Parameters from External System

An activity builder wants to pass through a tracking parameter:

```
full-screen.html
  ?wrappedInteractive=https://codap.concord.org/...
  &authoring=codap
  &custom:trackingId=activity-123
  &custom:variant=experimental
```

The authoring form opens with Advanced Options → Custom URL parameters enabled, pre-populated with:
```
trackingId=activity-123
variant=experimental
```

### Use Case 3: Combined Defaults and Customs

```
full-screen.html
  ?wrappedInteractive=https://codap.concord.org/...
  &authoring=codap
  &default:displayFullscreenButton=false
  &default:removeToolbarsAndGrid=true
  &custom:showAbout=false
```

### Use Case 4: Defaults Ignored for Saved Interactive

An author previously saved an interactive. They reopen it. Even though the URL still contains `&default:removeToolbarsAndGrid=true`, the saved state has `removeToolbarsAndGrid: false`. The saved value (`false`) wins.

## Implementation Notes

### Where to Parse

The prefixed parameters should be parsed in `app.tsx` alongside the existing `wrappedInteractive` and `authoring` parameter parsing. The parsed values are passed as props to `Authoring`, keeping the parsing logic centralized.

### Config-Agnostic Design

The `default:` mechanism is config-agnostic — it works based on the JSON Schema field types defined by whatever config is active, including both CODAP and generic configs. The `custom:` mechanism is CODAP-specific (it targets `advancedOptions.customParamsValue`) but could be generalized in the future by adding a config callback like `applyCustomParams(customs, formData)`.

### No New Dependencies

The implementation uses `URLSearchParams` (native browser API) for parsing. No new libraries are needed.
