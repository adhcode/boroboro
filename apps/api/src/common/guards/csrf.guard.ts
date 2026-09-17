import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';

export const SkipCsrf = () => (target: any, key?: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata('skipCsrf', true, descriptor.value);
    return descriptor;
  }
  Reflect.defineMetadata('skipCsrf', true, target);
  return target;
};

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF should be skipped for this route
    const skipCsrf = this.reflector.get<boolean>('skipCsrf', context.getHandler());
    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Generate and set CSRF token for GET requests
      const token = this.generateToken();
      response.header('X-CSRF-Token', token);
      return true;
    }

    // For POST, PUT, PATCH, DELETE - verify CSRF token
    const csrfTokenFromHeader = request.headers['x-csrf-token'];
    const csrfTokenFromBody = request.body?.csrfToken;
    
    const csrfToken = csrfTokenFromHeader || csrfTokenFromBody;

    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // In production, you'd validate against a stored token
    // For now, we just check if it exists and has correct format
    if (!this.isValidTokenFormat(csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private isValidTokenFormat(token: string): boolean {
    // Check if token is a 64-character hex string
    return /^[a-f0-9]{64}$/i.test(token);
  }
}
