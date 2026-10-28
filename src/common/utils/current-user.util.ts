import { UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

// Reads the user id placed on the request by JwtAuthGuard.
export function getUserId(request: AuthenticatedRequest): string {
  const userId = request.user?.sub;

  if (!userId) {
    throw new UnauthorizedException('Authentication required.');
  }

  return userId;
}
