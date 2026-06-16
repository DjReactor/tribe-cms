import { BusinessInfo } from '@/types';
import type { TemplateCopyKey } from '@/types';

/**
 * Resolves standard template variables inside a string.
 * Example: "Welcome to {{business_name}}" -> "Welcome to Apex Plumbing"
 * Empty businessInfo fields resolve to '' silently — no errors thrown.
 */
export function resolveTemplateTokens(text: string, businessInfo: BusinessInfo): string {
  if (!text) return '';
  
  return text
    .replace(/\{\{business_name\}\}/g, businessInfo.business_name || '')
    .replace(/\{\{city\}\}/g, businessInfo.city || '')
    .replace(/\{\{phone\}\}/g, businessInfo.phone || '')
    .replace(/\{\{business_type\}\}/g, businessInfo.business_type || '');
}

/**
 * Builds the final resolvedCopy map for a page by merging user overrides with
 * template manifest defaults, then resolving {{tokens}} against businessInfo.
 *
 * Priority: user override → manifest default → ''
 * Empty businessInfo fields (e.g. empty phone) resolve to '' silently.
 *
 * @param supportedCopyKeys - The template manifest's copy key definitions
 * @param copyOverrides     - User-saved overrides from settings.template_config.copyOverrides
 * @param businessInfo      - Live business data for token replacement
 */
export function buildResolvedCopy(
  supportedCopyKeys: Record<string, TemplateCopyKey> | undefined,
  copyOverrides: Record<string, string> | undefined,
  businessInfo: BusinessInfo
): Record<string, string> {
  if (!supportedCopyKeys) return {};

  const result: Record<string, string> = {};
  for (const [key, definition] of Object.entries(supportedCopyKeys)) {
    const raw = copyOverrides?.[key] || definition.default || '';
    result[key] = resolveTemplateTokens(raw, businessInfo);
  }
  return result;
}

