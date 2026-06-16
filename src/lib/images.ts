/**
 * Safely resolves an image URL by checking for user overrides before falling back
 * to the template's bundled default image.
 * 
 * @param key The universal layout key (e.g., 'hero_bg')
 * @param defaultUrl The static path bundled with the template (e.g., '/images/modern/hero.jpg')
 * @param config The template configuration object containing potential user overrides
 * @returns A string URL pointing to either the dynamic PocketBase file or the static fallback
 */
export function resolveImage(
  key: string,
  defaultUrl: string,
  config?: { imageOverrides?: Record<string, string>; [key: string]: unknown }
): string {
  // Defensive check: Ensure config and overrides object exists
  if (config && config.imageOverrides && typeof config.imageOverrides === 'object') {
    const overrideUrl = config.imageOverrides[key];
    
    // Defensive check: Ensure the override is a valid, non-empty string
    if (typeof overrideUrl === 'string' && overrideUrl.trim() !== '') {
      return overrideUrl;
    }
  }
  
  // Graceful fallback to the static asset
  return defaultUrl;
}

/**
 * Constructs a full URL to a PocketBase media file.
 * 
 * @param mediaItem The media item containing id and file properties
 * @returns A string URL to the file, or an empty string if invalid
 */
export function getMediaFileUrl(mediaItem: { id: string, file?: string } | undefined | null): string {
  if (!mediaItem || !mediaItem.file) return '';
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
  return `${pbUrl}/api/files/media/${mediaItem.id}/${mediaItem.file}`;
}
