/**
 * Extract domain from URL
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate regex pattern
 */
export function isValidRegex(pattern: string, flags: string): boolean {
  try {
    new RegExp(pattern, flags);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse regex pattern string (format: /pattern/replacement/flags)
 */
export function parseRegexPattern(input: string): {
  pattern: string;
  replacement: string;
  flags: string;
} | null {
  const match = input.match(/^\/(.+)\/(.*)\/([gimsuvy]*)$/);
  if (!match) return null;

  const [, pattern, replacement, flags] = match;
  return { pattern, replacement, flags };
}

/**
 * Debug log for development
 * TODO: Make this respect settings.debugMode from storage
 */
export function debugLog(...args: any[]): void {
  // Always log for now - can be toggled via settings later
  console.log('[ReTitle]', ...args);
}

/**
 * Process title template with variables
 * Supported variables:
 *   {original} or $0 - Original page title
 *   {url} - Current URL
 *   {domain} - Current domain
 */
export function processTitleTemplate(
  template: string,
  originalTitle: string,
  url?: string
): string {
  let result = template;

  // Replace {original} and $0 with original title
  result = result.replace(/\{original\}/gi, originalTitle);
  result = result.replace(/\$0/g, originalTitle);

  // Replace {url} with current URL
  if (url) {
    result = result.replace(/\{url\}/gi, url);

    // Replace {domain} with domain from URL
    const domain = getDomain(url);
    result = result.replace(/\{domain\}/gi, domain);
  }

  return result;
}
