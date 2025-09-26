// lib/apiClient.ts

/**
 * A centralized API client to handle all network requests for the application.
 * It wraps the native `fetch` API and provides consistent error handling and JSON parsing.
 * This approach avoids overwriting the global `window.fetch` and makes the code more
 * modular and testable.
 */

async function handleResponse(response: Response) {
    // For a '204 No Content' response, we can return immediately.
    if (response.status === 204) {
        return;
    }
    
    // Check if the response is JSON before trying to parse it.
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, we might have an issue. For simplicity, we'll try to get text.
        const text = await response.text();
        if (!response.ok) {
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }
        return text;
    }

    const data = await response.json();
    if (!response.ok) {
        // The API handlers return error messages in a 'message' property.
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
}

export const apiClient = {
    async get(url: string) {
        return handleResponse(await fetch(url));
    },

    async post(url: string, body?: any) {
        return handleResponse(await fetch(url, {
            method: 'POST',
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined,
        }));
    },

    async delete(url: string, body?: any) {
        return handleResponse(await fetch(url, {
            method: 'DELETE',
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined,
        }));
    },
};