import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../../users/users.service';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

// Runs after JwtAuthGuard. A JWT stays valid after its account is
// deleted, so routes that store per-user data also confirm the user
// still exists. This stops orphaned carts, devices and saved items.
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const userId = request.user?.sub;

    if (
      typeof userId !== 'string' ||
      !(await this.usersService.existsById(userId))
    ) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return true;
  }
}
