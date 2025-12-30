/**
 * Role helper utilities for multi-role user system
 */

export type Role = 'CUSTOMER' | 'STYLIST' | 'ADMIN';

export interface UserWithRoles {
  roles: Role[];
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserWithRoles | null | undefined, role: Role): boolean {
  if (!user?.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Check if user is a stylist (includes admins who may also style)
 */
export function isStylist(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'STYLIST');
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'CUSTOMER');
}

/**
 * Check if user has stylist-level access (STYLIST or ADMIN)
 */
export function hasStylistAccess(user: UserWithRoles | null | undefined): boolean {
  return isStylist(user) || isAdmin(user);
}

/**
 * Get the primary/highest role for display purposes
 * Priority: ADMIN > STYLIST > CUSTOMER
 */
export function getPrimaryRole(user: UserWithRoles | null | undefined): Role {
  if (!user?.roles?.length) return 'CUSTOMER';
  if (user.roles.includes('ADMIN')) return 'ADMIN';
  if (user.roles.includes('STYLIST')) return 'STYLIST';
  return 'CUSTOMER';
}

/**
 * Get display name for role badge
 */
export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'STYLIST':
      return 'Stylist';
    case 'CUSTOMER':
      return 'Customer';
    default:
      return 'Customer';
  }
}
