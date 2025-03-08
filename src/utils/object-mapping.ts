/** Retrieve a nested JSON from a key in dot notation. */
export function getNestedValue(key: string, translations: any): string | undefined {
  return key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), translations);
}

/** Flatten nested JSON keys into a dot notation list. */
export function flattenKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        keys = keys.concat(flattenKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}