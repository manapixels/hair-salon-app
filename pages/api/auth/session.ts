
/**
 * API Route: /api/auth/session
 * Checks if there is an active session.
 */
import { getSession } from '../../../lib/sessionStore';

export async function handleGet() {
    const session = getSession();
    if (session) {
        return { status: 200, body: session };
    } else {
        return { status: 401, body: { message: 'Not authenticated' } };
    }
}
