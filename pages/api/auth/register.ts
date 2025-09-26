
/**
 * API Route: /api/auth/register
 */
import { createUser } from '../../../lib/database';
import { setSession } from '../../../lib/sessionStore';

export async function handlePost(requestBody: any) {
    const { name, email, password } = requestBody;
    if (!name || !email || !password) {
        return { status: 400, body: { message: 'Name, email, and password are required.' } };
    }

    try {
        const newUser = createUser({ name, email, password });
        
        // Set a "session" for the new user
        setSession(newUser);
        
        return { status: 201, body: newUser };
    } catch (error: any) {
        return { status: 409, body: { message: error.message } };
    }
}
