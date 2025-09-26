import type { User } from '../types';
import { apiClient } from '../lib/apiClient';

/**
 * This file acts as an API client for the frontend for all auth-related actions.
 */

export const login = (email: string, password: string): Promise<User> => {
    return apiClient.post('/api/auth/login', { email, password });
};

export const register = (name: string, email: string, password:string): Promise<User> => {
    return apiClient.post('/api/auth/register', { name, email, password });
};

export const logout = async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
    // We don't need to return anything, so the promise is implicitly void.
};

export const checkSession = (): Promise<User> => {
    return apiClient.get('/api/auth/session');
};