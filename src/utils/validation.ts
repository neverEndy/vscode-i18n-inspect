
// validation.ts (or within your module)
export function isValidKey(key: string): boolean {
  // Example validation: a valid key must contain a dot.
  return key.includes('.');
}

export function isUrl(url: string): boolean {
	// Example validation: a valid key must contain a dot.
	return url.startsWith('http://') || url.startsWith('https://');
}


