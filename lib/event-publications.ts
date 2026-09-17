export const EVENT_FILE_LIMIT = 10 * 1024 * 1024
export const EVENT_FILE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'application/pdf': 'pdf', 'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export interface EventResource {
  id: string; publication_id: string; uploader_id: string; title: string;
  description: string | null; kind: string; storage_path: string | null;
  resource_url: string | null; created_at: string;
}

export function groupEventPublications(resources: EventResource[]) {
  const groups = new Map<string, EventResource[]>()
  for (const resource of resources) {
    // Include uploader in the key: a submitted group ID never confers authorship.
    const key = `${resource.uploader_id}:${resource.publication_id}`
    groups.set(key, [...(groups.get(key) ?? []), resource])
  }
  return Array.from(groups.values())
}

export function fileMatchesType(bytes: Uint8Array, type: string) {
  const start = (...values: number[]) => values.every((value, i) => bytes[i] === value)
  if (type === 'image/jpeg') return start(0xff, 0xd8, 0xff)
  if (type === 'image/png') return start(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
  if (type === 'image/webp') return start(82, 73, 70, 70) && String.fromCharCode(...Array.from(bytes.slice(8, 12))) === 'WEBP'
  if (type === 'application/pdf') return start(37, 80, 68, 70, 45)
  if (type === 'application/msword') return start(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)
  return type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && start(0x50, 0x4b, 3, 4)
}
