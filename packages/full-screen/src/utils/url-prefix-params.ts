import { RJSFSchema } from "@rjsf/utils";

export interface IPrefixedParams {
  defaults: Record<string, string>;
  customs: Record<string, string>;
}

/**
 * Extract default: and custom: prefixed parameters from a query string.
 *
 * @example
 * parsePrefixedParams("?default:removeToolbarsAndGrid=true&custom:foo=bar")
 * // { defaults: { removeToolbarsAndGrid: "true" }, customs: { foo: "bar" } }
 */
export const parsePrefixedParams = (search: string): IPrefixedParams => {
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

/**
 * Resolve the JSON Schema type for a dot-separated field path.
 * Traverses nested "object" schemas via their `properties`.
 *
 * @returns The schema `type` string or undefined if the path is invalid.
 */
const resolveSchemaType = (schema: RJSFSchema, fieldPath: string): string | undefined => {
  const parts = fieldPath.split(".");
  let current: RJSFSchema | undefined = schema;

  for (const part of parts) {
    if (!current || current.type !== "object" || !current.properties) {
      return undefined;
    }
    current = current.properties[part] as RJSFSchema | undefined;
  }

  return current?.type as string | undefined;
};

/**
 * Coerce a string value to the appropriate JS type based on a JSON Schema type.
 * Returns undefined if the value cannot be coerced.
 */
const coerceValue = (value: string, schemaType: string): unknown => {
  switch (schemaType) {
    case "boolean":
      return value === "true" || value === "1";
    case "integer": {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    case "number": {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    case "string":
      return value;
    default:
      return undefined;
  }
};

/**
 * Set a value at a dot-separated path in a nested object, returning a new object.
 * Creates intermediate objects as needed.
 */
const setNestedValue = (obj: Record<string, any>, path: string, value: unknown): Record<string, any> => {
  const parts = path.split(".");
  const result = { ...obj };
  let current: Record<string, any> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = { ...(current[part] || {}) };
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return result;
};

/**
 * Search a JSON Schema tree for a field by name and return its full dot-notation path.
 * Returns null if the field is not found or if multiple matches exist (ambiguous).
 */
export const findFieldInSchema = (
  schema: RJSFSchema,
  fieldName: string,
  currentPath = ""
): string | null => {
  if (!schema.properties) return null;

  const matches: string[] = [];

  for (const [key, prop] of Object.entries(schema.properties)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (key === fieldName) {
      matches.push(fullPath);
    }

    const propSchema = prop as RJSFSchema;
    if (propSchema.type === "object" && propSchema.properties) {
      const nested = findFieldInSchema(propSchema, fieldName, fullPath);
      if (nested) {
        matches.push(nested);
      }
    }
  }

  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    console.warn(`URL default: ambiguous field "${fieldName}" found at: ${matches.join(", ")}`);
  }
  return null;
};

/**
 * Apply URL default: parameters to initial form data based on JSON Schema types.
 * Only sets values for fields that exist in the schema with a coercible type.
 * Unqualified field names (no dot) are auto-resolved by searching the schema tree.
 * Logs warnings for invalid paths or un-coercible values.
 */
export const applyUrlDefaults = (
  initialData: Record<string, any>,
  defaults: Record<string, string>,
  schema: RJSFSchema
): Record<string, any> => {
  let data = { ...initialData };

  for (const [fieldPath, rawValue] of Object.entries(defaults)) {
    // Auto-resolve unqualified field names by searching the schema tree
    let resolvedPath = fieldPath;
    if (!fieldPath.includes(".")) {
      const found = findFieldInSchema(schema, fieldPath);
      if (found) {
        resolvedPath = found;
      }
    }

    const schemaType = resolveSchemaType(schema, resolvedPath);
    if (!schemaType) {
      console.warn(`URL default: ignored -- "${fieldPath}" does not match a field in the schema`);
      continue;
    }

    const coerced = coerceValue(rawValue, schemaType);
    if (coerced === undefined) {
      console.warn(`URL default: ignored -- cannot coerce "${rawValue}" to ${schemaType} for field "${fieldPath}"`);
      continue;
    }

    data = setNestedValue(data, resolvedPath, coerced);
  }

  return data;
};

/**
 * Apply URL custom: parameters to form data by appending them to the
 * customParamsValue field and enabling enableCustomParams.
 * Only applicable to configs that have advancedOptions.customParamsValue.
 */
export const applyUrlCustoms = (
  initialData: Record<string, any>,
  customs: Record<string, string>
): Record<string, any> => {
  if (Object.keys(customs).length === 0) return initialData;

  const advanced = initialData.advancedOptions;
  if (!advanced) return initialData;

  // Parse existing custom params to find keys already defined.
  // The textarea allows newline-separated entries, so normalize to & for URLSearchParams.
  const existing = advanced.customParamsValue?.trim() || "";
  const existingKeys = new Set(
    new URLSearchParams(existing.replace(/\r?\n/g, "&")).keys()
  );

  // Only add URL customs whose keys don't already exist (existing values take precedence)
  const newEntries = Object.entries(customs)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  if (!newEntries && !existing) return initialData;

  const merged = existing && newEntries
    ? `${existing}\n${newEntries}`
    : existing || newEntries;

  return {
    ...initialData,
    advancedOptions: {
      ...advanced,
      enableCustomParams: true,
      customParamsValue: merged
    }
  };
};
