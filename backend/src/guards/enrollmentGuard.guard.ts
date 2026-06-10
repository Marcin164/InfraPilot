import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { AgentTokenService } from 'src/services/agent-token.service';

/**
 * Guards the agent self-enrollment endpoint.
 *
 * Token is read from AdminSettings (DB) first; falls back to
 * AGENT_ENROLLMENT_TOKEN env var. Matched with timingSafeEqual to prevent
 * timing side-channel attacks.
 */
@Injectable()
export class EnrollmentGuard implements CanActivate {
  private readonly logger = new Logger(EnrollmentGuard.name);

  constructor(private readonly agentTokenService: AgentTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const expected = await this.agentTokenService.getToken();
    if (!expected || expected.length < 16) {
      this.logger.error(
        'Enrollment token is unset or too short — refusing enrollment.',
      );
      throw new ServiceUnavailableException('Enrollment is not configured');
    }

    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-enrollment-token'];
    if (typeof provided !== 'string') {
      throw new UnauthorizedException('Missing X-Enrollment-Token');
    }

    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid enrollment token');
    }

    return true;
  }
}
