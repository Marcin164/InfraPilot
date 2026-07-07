import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { AgentTokenService } from 'src/services/agent-token.service';
import { DeviceEnrollmentTokenService } from 'src/services/deviceEnrollmentToken.service';

/**
 * Guards the agent self-enrollment endpoint.
 *
 * Preferred path: a one-time, per-install token minted via
 * DeviceEnrollmentTokenService (Settings > Agent > "Nowy token"). Checked
 * first and, on match, atomically consumed so it can't be replayed.
 *
 * Legacy path: the single AGENT_ENROLLMENT_TOKEN shared across the whole
 * fleet (DB-stored or env var), matched with timingSafeEqual. Kept only so
 * snippets generated before per-device tokens existed keep working — the
 * UI no longer surfaces this token for new installs.
 */
@Injectable()
export class EnrollmentGuard implements CanActivate {
  private readonly logger = new Logger(EnrollmentGuard.name);

  constructor(
    private readonly agentTokenService: AgentTokenService,
    private readonly deviceEnrollmentTokenService: DeviceEnrollmentTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-enrollment-token'];
    if (typeof provided !== 'string' || !provided) {
      throw new UnauthorizedException('Missing X-Enrollment-Token');
    }

    const consumed = await this.deviceEnrollmentTokenService.validateAndConsume(provided);
    if (consumed) {
      (req as any).enrollmentTokenId = consumed.id;
      return true;
    }

    const expected = await this.agentTokenService.getToken();
    if (!expected || expected.length < 16) {
      this.logger.error(
        'No matching per-device token, and the legacy enrollment token is unset or too short — refusing enrollment.',
      );
      throw new UnauthorizedException('Invalid or expired enrollment token');
    }

    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid enrollment token');
    }

    return true;
  }
}
