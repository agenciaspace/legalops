// Bound browser auth requests so an unavailable provider cannot leave the form busy indefinitely.
export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = input instanceof Request ? input.url : String(input)
  if (!url.includes('/auth/v1/')) return fetch(input, init)
  const controller = new AbortController()
  const upstream = init?.signal ?? (input instanceof Request ? input.signal : undefined)
  const abort = () => controller.abort()
  if (upstream?.aborted) abort()
  else upstream?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 20000)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    upstream?.removeEventListener('abort', abort)
  }
}
