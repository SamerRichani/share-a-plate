let accessToken = null;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

export async function request(path, { body, headers, ...options } = {}) {
  const requestHeaders = new Headers(headers);
  if (body !== undefined)
    requestHeaders.set('Content-Type', 'application/json');
  if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);

  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'Unable to reach ShareAPlate. Check your connection and try again.',
      { cause: error },
    );
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok) {
    if (response.status === 401 && accessToken) {
      accessToken = null;
      window.dispatchEvent(new Event('shareaplate:session-expired'));
    }
    throw new ApiError(
      data?.error || 'Something went wrong. Please try again.',
      response.status,
    );
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
