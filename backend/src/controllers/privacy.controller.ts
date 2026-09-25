import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { PrivacyService } from 'src/services/privacy.service';
import { AuditService } from 'src/services/audit.service';
import { EraseUserDto } from 'src/dto/privacy.dto';

const actorOf = (req: any): string =>
  req?.user?.properties?.metadata?.id ?? req?.user?.id ?? 'unknown';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission('dpo.fullAccess')
@Controller('privacy')
export class PrivacyController {
  constructor(
    private readonly privacyService: PrivacyService,
    private readonly auditService: AuditService,
  ) {}

  // Read-only DPO visibility -- dpo.viewUserAsDpo alone is enough (widens
  // the class-level dpo.fullAccess default for just these two GET routes;
  // export/erase below stay on dpo.fullAccess only). Previously
  // dpo.viewUserAsDpo did nothing on its own: the frontend showed a "View
  // as DPO" button for it, but every backend route demanded fullAccess, so
  // it 403'd the moment you clicked through.
  @RequiresPermission('dpo.viewUserAsDpo', 'dpo.fullAccess')
  @Get('user/:id')
  async getUserPersonalData(@Param('id') id: string, @Req() req: any) {
    const actor = actorOf(req);
    const data = await this.privacyService.getPersonalData(id);
    await this.auditService.log('PrivacyRecord', id, 'read', {
      actor,
      targetUserId: id,
      fields: Object.keys(data ?? {}),
    });
    return data;
  }

  @RequiresPermission('dpo.viewUserAsDpo', 'dpo.fullAccess')
  @Get('access-log')
  async listAccessLog(
    @Query('targetUserId') targetUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.auditService.list({
      entityType: 'PrivacyRecord',
      entityId: targetUserId,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
  }

  /**
   * GDPR Art. 15 — right of access. Streams a ZIP containing everything we
   * hold about the subject.
   */
  @Post('user/:id/export')
  async exportUserData(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.privacyService.exportAllData(
      id,
      actorOf(req),
    );
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  /**
   * GDPR Art. 17 — right to erasure. Anonymises the user row, respecting
   * active legal holds (409 if blocked).
   */
  @Post('user/:id/erase')
  async eraseUser(
    @Param('id') id: string,
    @Body() body: EraseUserDto,
    @Req() req: any,
  ) {
    return this.privacyService.eraseUser(id, {
      actor: actorOf(req),
      reason: body?.reason ?? '',
    });
  }
}
