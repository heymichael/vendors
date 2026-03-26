/**
 * Fetch wrapper that adds a Firebase ID token to requests to the agent API.
 */
export async function agentFetch(
  url: string,
  getIdToken: () => Promise<string>,
  init?: RequestInit,
): Promise<Response> {
  const token = await getIdToken()
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...init, headers })
}
