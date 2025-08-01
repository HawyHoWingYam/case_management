import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums';

export const ROLES_KEY = 'roles';

/**
 * Custom decorator to specify required roles for a route
 * Usage: @Roles(UserRole.CLERK, UserRole.CHAIR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);