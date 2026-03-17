import { Json } from '@prisma/client';

export interface SanitizedResource {
  title: string;
  url: string;
  description?: string;
}

const MAX_RESOURCES = 50;
const MAX_URL_LENGTH = 500;

/**
 * Validates the whitelisted-resource list a teacher can attach to an
 * assessment. Returns `null` when the payload is invalid so the route can
 * respond with a 400 instead of storing arbitrary JSON (for example a
 * `javascript:` URL that would later be rendered in an iframe).
 */
export function sanitizeAllowedResources(value: unknown): SanitizedResource[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_RESOURCES) return null;

  const resources: SanitizedResource[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;

    const url = typeof record.url === 'string' ? record.url.trim() : '';
    if (!/^https?:\/\/\S+$/i.test(url) || url.length > MAX_URL_LENGTH) return null;

    const title = typeof record.title === 'string' ? record.title.trim().slice(0, 200) : '';
    if (!title) return null;

    const description =
      typeof record.description === 'string' ? record.description.trim().slice(0, 1000) : undefined;

    resources.push(description ? { title, url, description } : { title, url });
  }

  return resources;
}

/** Caps a JSON array field (starter files, test cases, rubric, options). */
export function sanitizeJsonArray(value: unknown, maxItems: number): Json[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems) as Json[];
}
