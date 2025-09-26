
/**
 * API Route: /api/auth/login
 */
import { findUserByEmail } from '../../../lib/database';
import { setSession } from '../../../lib/sessionStore';

export async function handlePost(requestBody: any) {
    const { email, password } = requestBody;
    if (!email || !password) {
        return { status: 400, body: { message: 'Email and password are required.' } };
    }

    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
        return { status: 401, body: { message: 'Invalid credentials.' } };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userToReturn } = user;
    
    // Set a "session"
    setSession(userToReturn);

    return { status: 200, body: userToReturn };
}
