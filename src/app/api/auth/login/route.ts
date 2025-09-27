/**
 * API Route: /api/auth/login
 */
import { findUserByEmail } from '../../../../lib/database';
import { setSession } from '../../../../lib/sessionStore';

export async function handlePost(requestBody: any) {
  const { email, password } = requestBody;
  if (!email || !password) {
    return { status: 400, body: { message: 'Email and password are required.' } };
  }

  const user = await findUserByEmail(email);

  if (!user || user.password !== password) {
    return { status: 401, body: { message: 'Invalid credentials.' } };
  }

  const { password: _password, ...userToReturn } = user;

  // Convert role from Prisma enum to app type
  const userForSession = {
    ...userToReturn,
    role: user.role.toLowerCase() as 'customer' | 'admin',
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };

  // Set a "session"
  setSession(userForSession);

  return { status: 200, body: userForSession };
}
