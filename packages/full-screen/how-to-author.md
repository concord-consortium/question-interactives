# Full-Screen Interactive: Authoring Guide

The full-screen interactive wraps other web-based interactives (such as CODAP) and provides fullscreen support, state management, and a structured authoring form. This guide covers how authoring works for both curriculum authors and administrators who configure Library Interactives.

## Table of Contents

- [Overview](#overview)
- [Authoring Form: CODAP](#authoring-form-codap)
- [Authoring Form: Generic (Fallback)](#authoring-form-generic-fallback)
- [URL Parameters for Library Interactive Configuration](#url-parameters-for-library-interactive-configuration)
  - [Selecting the Authoring Type](#selecting-the-authoring-type)
  - [Setting Default Form Values](#setting-default-form-values)
  - [Adding Custom URL Parameters](#adding-custom-url-parameters)
  - [Complete URL Examples](#complete-url-examples)
- [How the Final URL is Built](#how-the-final-url-is-built)

---

## Overview

The full-screen interactive has two authoring modes:

- **CODAP mode** -- A structured form with checkboxes for common CODAP URL parameters. Used when the wrapped interactive is a CODAP document.
- **Generic mode** -- A simple form with a URL field and a fullscreen toggle. Used for any other wrapped interactive.

The authoring mode is determined automatically based on the wrapped URL, or can be set explicitly via URL parameters (see [Selecting the Authoring Type](#selecting-the-authoring-type)).

---

## Authoring Form: CODAP

When the authoring type is CODAP, the form presents structured options for configuring a CODAP interactive.

### Source URL

| Field | Description |
|---|---|
| **CODAP Source Document URL** | Paste a share link from the CODAP Share dialog. Accepts shared links (`#shared=...`), document URLs (`?documentId=...`), and iframe embed codes. |

### CODAP Options

These checkboxes map to standard CODAP URL parameters:

| Option | Default | What it does |
|---|---|---|
| **Display fullscreen button** | On | Shows a button that lets users open CODAP in fullscreen mode. |
| **Display data visibility toggles on graphs** | Off | Adds toggles to graphs for showing/hiding cases based on the leftmost dataset attribute. Maps to `app=is`. |
| **Display all visible components within bounds** | Off | Keeps components inside the browser window and prevents scrollbars. Maps to `inbounds=true`. |
| **Remove toolbars & background grid** | Off | Hides CODAP's toolbars and background grid. Components remain moveable. Maps to `embeddedMode=yes`. |
| **Lock components** | Off | Locks component positions so users cannot move them. Only available when "Remove toolbars & background grid" is checked. Maps to `componentMode=yes`. |

### Advanced CODAP Options

These options are in a collapsible section at the bottom of the form.

| Option | Default | What it does |
|---|---|---|
| **Load a plugin from a URL** | Off | When checked, loads a CODAP plugin from the URL entered below. Maps to `di=<url>`. |
| Plugin URL | _(empty)_ | The URL of the plugin to load. Only editable when the plugin checkbox is checked. |
| **Replace contents of an existing plugin** | Off | When checked, replaces an existing plugin matching the string entered below. Only available when the plugin checkbox is checked. Maps to `di-override=<string>`. |
| Override value | _(empty)_ | A substring of the existing plugin URL to replace. |
| **Display a specific guide page** | Off | When checked, opens a specific guide page on load. Maps to `guideIndex=<int>`. |
| Guide index value | 0 | Which guide page to display (0 = first page). |
| **Custom URL parameters** | Off | When checked, adds the parameters entered below to the final CODAP URL. Supports `key=value` pairs separated by newlines or `&`. |
| Custom params text | _(empty)_ | One `key=value` pair per line, or `key1=value1&key2=value2` format. |

### Read-Only Display Fields

| Field | Description |
|---|---|
| **Passthrough Parameters** | Shows parameters from the source URL that are not controlled by the form options above. These are automatically included in the generated URL. If custom parameters override all passthrough parameters, an explanatory message is shown instead. |
| **Generated URL** | The final URL that will be used for this interactive at runtime. Updated automatically as form values change. |

### Source URL Re-Parse Behavior

When you paste a new CODAP source URL, the form automatically extracts settings from that URL and updates the corresponding checkboxes. For example, pasting a URL containing `embeddedMode=yes` will check the "Remove toolbars & background grid" option.

Settings that are independent of the source URL -- such as the fullscreen button toggle, custom parameters, and plugin settings that were configured manually or via defaults -- are preserved when the source URL changes.

---

## Authoring Form: Generic (Fallback)

When the wrapped URL is not recognized as CODAP, or when no specific authoring type is configured, the generic form is used.

| Field | Default | Description |
|---|---|---|
| **Wrapped Interactive URL** | _(empty)_ | The full URL of the interactive to wrap, including any query parameters. Used as-is without transformation. |
| **Enable Fullscreen Mode** | On | When checked, enables fullscreen scaling and shows the fullscreen button. |

---

## URL Parameters for Library Interactive Configuration

When setting up a Library Interactive, administrators enter a URL into a configuration form. This URL can include special parameters that control which authoring form is shown and what default values are pre-filled. Curriculum authors who use the Library Interactive will then see the authoring form with those defaults already applied.

### Selecting the Authoring Type

Use the `authoring` parameter to explicitly select the authoring form:

```
?authoring=codap      -- Use the CODAP authoring form
?authoring=generic    -- Use the generic authoring form
```

If `authoring` is not specified, the type is auto-detected from the `wrappedInteractive` URL. URLs containing `codap.concord.org` or `codap3.concord.org` are detected as CODAP. All other URLs fall back to the generic form.

> **Note for development:** Local CODAP instances (localhost, ngrok, etc.) are not auto-detected. Use `?authoring=codap` explicitly when testing with local URLs.

### Setting Default Form Values

Use `default:` prefixed parameters to pre-fill form fields. These values are applied when a curriculum author creates a new interactive. They do not override previously saved authored state.

**Format:** `?default:<fieldName>=<value>`

**Type coercion:** String values from the URL are converted to the appropriate type based on the form schema:
- Boolean fields: `true` or `1` becomes checked; anything else becomes unchecked
- Integer fields: Parsed as a whole number
- String fields: Used as-is

#### Available Default Fields (CODAP)

| Parameter | Type | Description |
|---|---|---|
| `default:displayFullscreenButton` | boolean | Show/hide fullscreen button |
| `default:displayDataVisibilityToggles` | boolean | Data visibility toggles on graphs |
| `default:displayAllComponentsAlways` | boolean | Keep components within canvas bounds |
| `default:removeToolbarsAndGrid` | boolean | Remove toolbars and background grid |
| `default:lockComponents` | boolean | Lock component positions |
| `default:advancedOptions.enableDi` | boolean | Enable plugin loading |
| `default:advancedOptions.diPluginUrl` | string | Plugin URL |
| `default:advancedOptions.enableDiOverride` | boolean | Enable plugin replacement |
| `default:advancedOptions.diOverrideValue` | string | Plugin override match string |
| `default:advancedOptions.enableGuideIndex` | boolean | Enable specific guide page |
| `default:advancedOptions.guideIndexValue` | integer | Guide page index (0-based) |
| `default:advancedOptions.enableCustomParams` | boolean | Enable custom parameters |
| `default:advancedOptions.customParamsValue` | string | Custom parameter text |

#### Available Default Fields (Generic)

| Parameter | Type | Description |
|---|---|---|
| `default:sourceUrl` | string | Wrapped interactive URL |
| `default:enableFullscreen` | boolean | Enable fullscreen mode |

### Adding Custom URL Parameters

Use `custom:` prefixed parameters to inject additional URL parameters into the CODAP custom params field. This is a convenient shorthand for setting `default:advancedOptions.enableCustomParams=true` and populating the custom params text.

**Format:** `?custom:<paramName>=<value>`

When `custom:` parameters are present:
- The "Custom URL parameters" checkbox is automatically enabled
- Each `custom:` parameter is added as a `key=value` line in the custom params text
- If the custom params text already contains a key, the existing value takes precedence (no duplicates)

### Complete URL Examples

**CODAP with embedded mode and locked components enabled by default:**
```
?authoring=codap&default:removeToolbarsAndGrid=true&default:lockComponents=true
```

**CODAP with a plugin pre-configured:**
```
?authoring=codap&default:advancedOptions.enableDi=true&default:advancedOptions.diPluginUrl=https://example.com/plugin
```

**CODAP with custom parameters injected:**
```
?authoring=codap&custom:foo=bar&custom:baz=qux
```

**CODAP with fullscreen disabled and a specific guide page:**
```
?authoring=codap&default:displayFullscreenButton=false&default:advancedOptions.enableGuideIndex=true&default:advancedOptions.guideIndexValue=2
```

**Generic with fullscreen disabled:**
```
?authoring=generic&default:enableFullscreen=false
```

**Combining wrapped URL, authoring type, and defaults:**
```
?wrappedInteractive=https://codap.concord.org/app%23shared%3Ddoc123&authoring=codap&default:removeToolbarsAndGrid=true&custom:myParam=myValue
```

---

## How the Final URL is Built

When a curriculum author saves the CODAP authoring form, the final URL is constructed from the form values:

1. The source URL is parsed to extract the base CODAP URL and document identifier
2. `interactiveApi` is added (required for LARA communication)
3. The document identifier is added as `documentId` (legacy `url=` inputs are normalized to `documentId`)
4. Checked CODAP options are added as URL parameters (e.g., `embeddedMode=yes`)
5. Advanced options are added when enabled (e.g., `di=<pluginUrl>`)
6. Passthrough parameters from the source URL (parameters not controlled by the form) are preserved
7. Custom parameters are appended, overriding any passthrough parameters with the same key

The resulting URL is stored as the `wrappedInteractiveUrl` in the authored state and used at runtime to load the interactive.

For the generic form, the source URL is used directly without transformation.
