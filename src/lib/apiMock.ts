import * as availabilityApi from '../app/api/availability/route';
import * as appointmentsApi from '../app/api/appointments/route';
import * as chatApi from '../app/api/chat/route';
import * as adminSettingsApi from '../app/api/admin/settings/route';
import * as adminBlockedSlotsApi from '../app/api/admin/blocked-slots/route';
import * as authLoginApi from '../app/api/auth/login/route';
import * as authRegisterApi from '../app/api/auth/register/route';
import * as authLogoutApi from '../app/api/auth/logout/route';
import * as authSessionApi from '../app/api/auth/session/route';
import { apiClient } from './apiClient';

export const startApiMock = () => {
  console.log('Starting API mock...');

  const routeRequest = async (method: string, urlStr: string, body?: any) => {
    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname;
    console.log(`[API Mock] Intercepted ${method} ${path}${url.search}`);

    let result: { status: number; body: any } | null = null;

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
      result = { status: 500, body: { message: 'Internal Server Error in Mock API' } };
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
  apiClient.get = url => routeRequest('GET', url);
  apiClient.post = (url, body) => routeRequest('POST', url, body);
  apiClient.delete = (url, body) => routeRequest('DELETE', url, body);
};
