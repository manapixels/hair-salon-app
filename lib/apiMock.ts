
import * as availabilityApi from '../pages/api/availability';
import * as appointmentsApi from '../pages/api/appointments';
import * as chatApi from '../pages/api/chat';
import * as adminSettingsApi from '../pages/api/admin/settings';
import * as adminBlockedSlotsApi from '../pages/api/admin/blocked-slots';
import * as authLoginApi from '../pages/api/auth/login';
import * as authRegisterApi from '../pages/api/auth/register';
import * as authLogoutApi from '../pages/api/auth/logout';
import * as authSessionApi from '../pages/api/auth/session';
import { apiClient } from './apiClient';

export const startApiMock = () => {
    console.log("Starting API mock...");

    const routeRequest = async (method: string, urlStr: string, body?: any) => {
        const url = new URL(urlStr, window.location.origin);
        const path = url.pathname;
        console.log(`[API Mock] Intercepted ${method} ${path}${url.search}`);
        
        let result: { status: number; body: any; } | null = null;

        try {
            // GET routes
            if (method === 'GET') {
                if (path === '/api/availability') {
                    const date = url.searchParams.get('date');
                    result = await availabilityApi.handleGet({ date: date || undefined });
                } else if (path === '/api/admin/settings') {
                    result = await adminSettingsApi.handleGet();
                } else if (path === '/api/auth/session') {
                    result = await authSessionApi.handleGet();
                }
            }
            // POST routes
            else if (method === 'POST') {
                if (path === '/api/appointments') {
                    result = await appointmentsApi.handlePost(body);
                } else if (path === '/api/chat') {
                    result = await chatApi.handlePost(body);
                } else if (path === '/api/admin/settings') {
                    result = await adminSettingsApi.handlePost(body);
                } else if (path === '/api/admin/blocked-slots') {
                    result = await adminBlockedSlotsApi.handlePost(body);
                } else if (path === '/api/auth/login') {
                    result = await authLoginApi.handlePost(body);
                } else if (path === '/api/auth/register') {
                    result = await authRegisterApi.handlePost(body);
                } else if (path === '/api/auth/logout') {
                    result = await authLogoutApi.handlePost();
                }
            }
            // DELETE routes
            else if (method === 'DELETE') {
                 if (path === '/api/admin/blocked-slots') {
                    result = await adminBlockedSlotsApi.handleDelete(body);
                }
            }
        } catch (error) {
            console.error(`[API Mock] Error in handler for ${method} ${path}:`, error);
            result = { status: 500, body: { message: "Internal Server Error in Mock API" } };
        }

        if (result) {
            if (result.status >= 200 && result.status < 300) {
                return result.body; // On success, return the body, mimicking apiClient
            } else {
                // On error, throw an error with the message, mimicking apiClient
                throw new Error(result.body.message || `Mock API Error: ${result.status}`);
            }
        }
        
        throw new Error(`[API Mock] No mock handler found for ${method} ${path}.`);
    };
    
    // Override apiClient methods with our mock router
    apiClient.get = (url) => routeRequest('GET', url);
    apiClient.post = (url, body) => routeRequest('POST', url, body);
    apiClient.delete = (url, body) => routeRequest('DELETE', url, body);
};