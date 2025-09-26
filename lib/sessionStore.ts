
import type { User } from '../types';

let activeSession: User | null = null;

export const getSession = (): User | null => {
    return activeSession;
};

export const setSession = (user: User | null): void => {
    activeSession = user;
};

export const clearSession = (): void => {
    activeSession = null;
};
