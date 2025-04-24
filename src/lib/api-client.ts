import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  console.error('Error: NEXT_PUBLIC_BACKEND_URL environment variable is not defined.');
  // Potentially throw an error here in production builds or add build-time validation
}

/**
 * Placeholder function to get the auth token.
 * This will be replaced/integrated with a more robust session management approach.
 * Requires NextAuth types to be augmented to properly access `accessToken`.
 */
async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  const token = session?.user?.accessToken;
  return token || null;
}

/**
 * Custom Error class for API errors.
 */
export class ApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

/**
 * Centralized API fetch function.
 * Handles base URL, common headers, authentication token, and basic error handling.
 *
 * @param endpoint The API endpoint path (e.g., '/projects').
 * @param options Standard fetch options (method, body, etc.).
 * @returns The JSON response body.
 * @throws {ApiError} If the fetch fails or the response status is not OK.
 */
export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        // Ignore if response body is not JSON
      }
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    // Handle cases where the response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T; // Or return null, depending on desired behavior
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors
      throw error;
    } else if (error instanceof Error) {
      // Wrap other fetch-related errors (network issues, etc.)
      console.error('Network or fetch error:', error);
      throw new ApiError(`Network error: ${error.message}`, 0); // Status 0 for network errors
    } else {
      // Catch unexpected errors
      console.error('Unexpected error during fetchApi:', error);
      throw new ApiError('An unexpected error occurred', 500);
    }
  }
}

// Exported API client object with helper methods for common HTTP verbs.
export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = unknown>(endpoint: string, body: Record<string, unknown> | unknown[], options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T = unknown>(endpoint: string, body: Record<string, unknown> | unknown[], options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = unknown>(endpoint: string, body: Record<string, unknown> | unknown[], options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string, options?: RequestInit) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};
