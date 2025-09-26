
/**
 * API Route: /api/auth/logout
 */
import { clearSession } from '../../../lib/sessionStore';

export async function handlePost() {
    // Clear the "session"
    clearSession();
    return { status: 200, body: { message: 'Logged out successfully' } };
}
