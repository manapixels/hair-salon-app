// lib/apiClient.ts

/**
 * A centralized API client to handle all network requests for the application.
 * It wraps the native `fetch` API and provides consistent error handling and JSON parsing.
 * This approach avoids overwriting the global `window.fetch` and makes the code more
 * modular and testable.
 */

async function handleResponse<T = any>(response: Response): Promise<T> {
  // For a '204 No Content' response, we can return immediately.
  if (response.status === 204) {
    return null as T;
  }

  // Check if the response is JSON before trying to parse it.
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // If not JSON, we might have an issue. For simplicity, we'll try to get text.
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return text as unknown as T;
  }

  const data = (await response.json()) as T;
  if (!response.ok) {
    // The API handlers return error messages in a 'message' property.
    const errorData = data as any;
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return data;
}

export const apiClient = {
  async get<T = any>(url: string): Promise<T> {
    return handleResponse<T>(await fetch(url));
  },

  async post<T = any>(url: string, body?: any): Promise<T> {
    return handleResponse<T>(
      await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  },

  async delete<T = any>(url: string, body?: any): Promise<T> {
    return handleResponse<T>(
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  },

  async put<T = any>(url: string, body?: any): Promise<T> {
    return handleResponse<T>(
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  },

  async patch<T = any>(url: string, body?: any): Promise<T> {
    return handleResponse<T>(
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  },
};
