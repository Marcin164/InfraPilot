import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { AuditService } from 'src/services/audit.service';
import { AuditSinksService } from 'src/services/auditSinks/orchestrator.service';

const csvCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin, Role.Auditor)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly sinks: AuditSinksService,
  ) {}

  @Get('verify')
  async verify() {
    return this.auditService.verifyChain();
  }

  @Get('sinks')
  sinksStatus() {
    return this.sinks.status();
  }

  @Get('ticket/:ticketId')
  async getTicketAudit(
    @Param('ticketId') ticketId: string,
    @Query() query: any,
  ) {
    return this.auditService.getForTicket(ticketId, query.action);
  }

  @Get('entity/:entityType/:entityId')
  async getEntityAudit(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getForEntity(entityType, entityId);
  }

  @Get()
  async list(@Query() query: any) {
    return this.auditService.list({
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      actorId: query.actorId,
      from: query.from,
      to: query.to,
      limit: query.limit ? Number(query.limit) : undefined,
      cursor: query.cursor,
    });
  }

  @Get('export')
  async export(@Query() query: any, @Res() res: Response) {
    const rows = await this.auditService.exportRange({
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      from: query.from,
      to: query.to,
    });

    const header = [
      'sequence',
      'createdAt',
      'entityType',
      'entityId',
      'action',
      'actor',
      'metadata',
      'hash',
      'prevHash',
    ];
    const lines = [header.join(',')];
    for (const row of rows) {
      const actor = (row.metadata as any)?.actor ?? '';
      lines.push(
        [
          row.sequence,
          row.createdAt.toISOString(),
          row.entityType,
          row.entityId ?? '',
          row.action,
          actor,
          row.metadata ? JSON.stringify(row.metadata) : '',
          row.hash ?? '',
          row.prevHash ?? '',
        ]
          .map(csvCell)
          .join(','),
      );
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(lines.join('\n'));
  }
}
