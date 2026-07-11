import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { AgentGuard } from 'src/guards/agentGuard.guard';
import { EnrollmentGuard } from 'src/guards/enrollmentGuard.guard';
import { idempotencyCache } from 'src/helpers/idempotencyCache';
import { Role, Roles } from 'src/decorators/roles.decorator';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { DevicesService } from 'src/services/devices.service';
import { DeviceTagsService } from 'src/services/deviceTags.service';
import { AgentTaskService } from 'src/services/agentTask.service';
import { DeviceReportService } from 'src/services/deviceReport.service';
import { HandoverFormService } from 'src/services/handoverForm.service';
import { RemoteAssistService } from 'src/services/remoteAssist.service';
import { AuditService } from 'src/services/audit.service';
import {
  AgentEnrollDto,
  CreateEnrollmentTokenDto,
  DeviceScanDto,
  AddDeviceDto,
  BulkImportDevicesDto,
  AssignDeviceDto,
  CreateDeviceTagDto,
  MergeDevicesDto,
  StartRemoteSessionDto,
  UpdateDeviceLifecycleDto,
  UpdateDeviceDetailsDto,
  BulkTagActionDto,
  BulkAssignDto,
  BulkLifecycleDto,
  EnqueueBulkTasksDto,
  EnqueueTaskDto,
  ClaimTasksDto,
  CompleteTaskDto,
  FailTaskDto,
} from 'src/dto/devices.dto';
import { AgentTokenService } from 'src/services/agent-token.service';
import { AgentInstallerService, type AgentPlatform } from 'src/services/agent-installer.service';
import { AgentBootstrapService } from 'src/services/agent-bootstrap.service';
import { DeviceEnrollmentTokenService } from 'src/services/deviceEnrollmentToken.service';
import { LINUX_PACKAGE_SIGNING_PUBLIC_KEY } from 'src/config/packageSigningKey';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly tagsService: DeviceTagsService,
    private readonly agentTasks: AgentTaskService,
    private readonly deviceReport: DeviceReportService,
    private readonly handoverForm: HandoverFormService,
    private readonly remoteAssist: RemoteAssistService,
    private readonly auditService: AuditService,
    private readonly agentTokenService: AgentTokenService,
    private readonly agentInstallerService: AgentInstallerService,
    private readonly agentBootstrapService: AgentBootstrapService,
    private readonly enrollmentTokenService: DeviceEnrollmentTokenService,
  ) {}

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post()
  async addDevice(@Body() body: AddDeviceDto): Promise<any> {
    return this.devicesService.addDevice(body);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('bulk-import')
  async bulkImportDevices(
    @Body() body: BulkImportDevicesDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const result = await this.devicesService.bulkImport(body.rows ?? []);
    await this.auditService.log('Device', null, 'bulk_import', {
      actor,
      created: result.created,
      skipped: result.skipped,
    });
    return result;
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('assign')
  async assignDevice(@Body() body: AssignDeviceDto) {
    return this.devicesService.assignDeviceToUser(body.deviceId, body.userId);
  }

  @UseGuards(AuthGuard)
  @Get('/options')
  async findDevicesWithSerial(): Promise<any> {
    return this.devicesService.findDevicesWithSerial();
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.devicesService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('/table')
  async findDevicesTable(@Query() query: any): Promise<any> {
    return this.devicesService.findDevicesTable(query);
  }

  @UseGuards(AuthGuard)
  @Get('/filters')
  async getFilters() {
    return this.devicesService.getFilterOptions();
  }

  // ---- Tags (must be before /:deviceId to avoid route shadowing) ----

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/tags')
  listTags() {
    return this.tagsService.listTags();
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/tags')
  createTag(@Body() body: CreateDeviceTagDto) {
    return this.tagsService.createTag(body);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/tags/:id/delete')
  async deleteTag(@Param('id') id: string) {
    await this.tagsService.deleteTag(id);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('/:deviceId')
  async findDevice(@Param('deviceId') deviceId: string): Promise<any> {
    return this.devicesService.findDevice(deviceId);
  }

  @UseGuards(AuthGuard)
  @Get('/user/:userId')
  async findUserDevices(@Param('userId') userId: string): Promise<any> {
    return this.devicesService.findUserDevices(userId);
  }

  @UseGuards(AuthGuard)
  @Get('/application/:id')
  async findDevicesWithApllication(@Param('id') id: string): Promise<any> {
    return this.devicesService.findDevicesWithApplication(id);
  }

  @UseGuards(EnrollmentGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Post('/agent/enroll')
  async enrollAgent(@Body() body: AgentEnrollDto, @Req() req: any) {
    const hasAnyId =
      !!body.tpmFingerprint ||
      (Array.isArray(body.macAddresses) && body.macAddresses.length > 0) ||
      !!body.cpuId ||
      !!body.serialNumber;
    if (!hasAnyId) {
      throw new BadRequestException(
        'Enrollment payload must carry at least one of tpmFingerprint, macAddresses, cpuId, serialNumber',
      );
    }
    const result = await this.devicesService.enrollAgent(body);

    // Set by EnrollmentGuard when a per-device token (not the legacy shared
    // one) was redeemed for this request — link it to the device it just
    // created so the audit trail shows which token this was.
    const enrollmentTokenId = (req as any).enrollmentTokenId as string | undefined;
    if (enrollmentTokenId) {
      await this.enrollmentTokenService.linkDevice(enrollmentTokenId, result.deviceId);
    }

    await this.auditService.log('Device', result.deviceId, 'agent_enrolled', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      matched: result.matched,
      matchReasons: result.matchReasons,
      hostname: body.hostname ?? null,
      serialNumber: body.serialNumber ?? null,
      agentVersion: body.agentVersion ?? null,
      platform: body.platform ?? null,
      deviceType: body.deviceType ?? null,
      enrollmentTokenId: enrollmentTokenId ?? null,
    });
    return {
      deviceId: result.deviceId,
      secret: result.secret,
      matched: result.matched,
      matchReasons: result.matchReasons,
    };
  }

  @UseGuards(AgentGuard)
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  @Post('/agent/data')
  async receiveData(@Body() body: DeviceScanDto, @Req() req: any) {
    const device = (req as any).agentDevice;

    // Idempotency — agent retries (network glitch) shouldn't double-write
    // scan history or audit. We accept either an explicit
    // X-Idempotency-Key header or fall back to the HMAC nonce which is
    // already required and unique per request.
    const idempotencyKey =
      (req.headers['x-idempotency-key'] as string | undefined) ??
      (req.headers['x-nonce'] as string | undefined) ??
      null;

    if (idempotencyKey) {
      const cached = idempotencyCache.get<unknown>(
        `agent-scan:${device.id}`,
        idempotencyKey,
      );
      if (cached) {
        return cached;
      }
    }

    const { device: updated, serialChanged, software } =
      await this.devicesService.recordScan(device, body);

    await this.auditService.log('Device', device.id, 'agent_scan', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      serialNumber: updated.serialNumber ?? null,
      sections: Object.keys(body ?? {}),
      software,
    });
    if (serialChanged) {
      await this.auditService.log('Device', device.id, 'serial_changed', {
        ip: req.ip,
        previous: device.serialNumber,
        reported: body?.hardware?.baseboard?.serial_number ?? body?.serialNumber,
      });
    }

    const response = { ok: true, deviceId: device.id, software };
    if (idempotencyKey) {
      idempotencyCache.put(
        `agent-scan:${device.id}`,
        idempotencyKey,
        response,
      );
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/merge-candidates')
  async getMergeCandidates(@Param('deviceId') deviceId: string) {
    return this.devicesService.findMergeCandidates(deviceId);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/:deviceId/merge')
  async mergeDevices(
    @Param('deviceId') deviceId: string,
    @Body() body: MergeDevicesDto,
    @Req() req: any,
  ) {
    const actorId =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    return this.devicesService.mergeDevices(
      deviceId,
      body.sourceDeviceId,
      actorId,
    );
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Helpdesk)
  @Post('/:deviceId/remote-session')
  async startRemoteSession(
    @Param('deviceId') deviceId: string,
    @Body() body: StartRemoteSessionDto,
    @Req() req: any,
  ) {
    const actorId =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? 'unknown';
    return this.remoteAssist.startSession({
      deviceId,
      actorId,
      ticketId: body?.ticketId ?? null,
    });
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Helpdesk)
  @Get('/remote-session/status')
  remoteSessionStatus() {
    return { configured: this.remoteAssist.isConfigured() };
  }

  private resolveBaseUrl(req: any): string {
    const proto =
      (req.headers['x-forwarded-proto'] as string) ?? req.protocol ?? 'https';
    const host =
      (req.headers['x-forwarded-host'] as string) ?? req.headers['host'];
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  // ---- Agent setup (Settings > Agent page) ----
  //
  // Installer download status per platform only — no token, no snippet.
  // Install snippets are minted on demand from a one-time per-device token,
  // see createEnrollmentToken below.
  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Get('/agent/setup-info')
  async agentSetupInfo(@Req() req: any) {
    const baseUrl = this.resolveBaseUrl(req);

    // AGENT_INSTALLER_URL_<PLATFORM> wins when set (e.g. CDN / GitHub
    // Releases). `AGENT_INSTALLER_URL` (no suffix) is kept as a legacy
    // alias for Windows only. Otherwise, if an admin has uploaded an
    // installer through this page, self-host it. `?.trim() || ...` (not
    // `??`) on purpose: an env var present but left blank (common with
    // .env templates / docker-compose) is `""`, which `??` treats as "set"
    // and would silently kill the self-hosted fallback.
    const windowsMeta = await this.agentInstallerService.getMeta('windows');
    const windowsUrl = await this.resolveInstallerUrl('windows', baseUrl, windowsMeta);

    const macosMeta = await this.agentInstallerService.getMeta('macos');
    const macosUrl = await this.resolveInstallerUrl('macos', baseUrl, macosMeta);

    const linuxMeta = await this.agentInstallerService.getMeta('linux');
    const linuxUrl = await this.resolveInstallerUrl('linux', baseUrl, linuxMeta);

    return {
      backendUrl: baseUrl,
      windows: { installerUrl: windowsUrl, installerMeta: windowsMeta },
      macos: { installerUrl: macosUrl, installerMeta: macosMeta },
      linux: { installerUrl: linuxUrl, installerMeta: linuxMeta },
    };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/agent/token/rotate')
  async rotateAgentToken() {
    const newToken = await this.agentTokenService.rotateToken();
    return { success: true, token: newToken };
  }

  // ---- Per-device enrollment tokens (Settings > Agent > "Nowy token") ----
  //
  // Replaces the fleet-wide token as the primary bootstrap path: one-time,
  // expires on its own, and every install traces back to exactly which
  // token created it. /agent/token/rotate above still exists as a legacy
  // fallback for snippets generated before this existed.

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/agent/enrollment-tokens')
  async createEnrollmentToken(
    @Body() body: CreateEnrollmentTokenDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const { id, rawToken, expiresAt } = await this.enrollmentTokenService.generate(
      body.label ?? null,
      body.ttlHours,
      actor,
    );

    const baseUrl = this.resolveBaseUrl(req);
    const windowsMeta = await this.agentInstallerService.getMeta('windows');
    const windowsUrl = await this.resolveInstallerUrl('windows', baseUrl, windowsMeta);
    const macosMeta = await this.agentInstallerService.getMeta('macos');
    const macosUrl = await this.resolveInstallerUrl('macos', baseUrl, macosMeta);
    const linuxMeta = await this.agentInstallerService.getMeta('linux');
    const linuxUrl = await this.resolveInstallerUrl('linux', baseUrl, linuxMeta);

    // Same bootstrap-code wrapper used everywhere else — the snippet itself
    // never contains the raw token, just a short-lived redemption code (see
    // AgentBootstrapService).
    const bootstrapCode = this.agentBootstrapService.mint(baseUrl, rawToken);
    const bootstrapBase = `${baseUrl}/devices/agent/bootstrap/${bootstrapCode}`;
    const host = (req.headers['x-forwarded-host'] as string) ?? req.headers['host'];
    const bootstrapBaseHttp = `http://${host}/devices/agent/bootstrap/${bootstrapCode}`;

    await this.auditService.log('DeviceEnrollmentToken', id, 'created', {
      actor,
      label: body.label ?? null,
      expiresAt,
    });

    return {
      id,
      label: body.label ?? null,
      expiresAt,
      windows: {
        snippet: windowsUrl
          ? `# Run as Administrator\nirm "${bootstrapBaseHttp}/windows" | iex`
          : null,
      },
      macos: {
        snippet: macosUrl ? `curl -fsSL "${bootstrapBase}/macos" | sudo bash` : null,
      },
      linux: {
        snippet: linuxUrl ? `curl -fsSL "${bootstrapBase}/linux" | sudo bash` : null,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Get('/agent/enrollment-tokens')
  async listEnrollmentTokens() {
    return this.enrollmentTokenService.list();
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Delete('/agent/enrollment-tokens/:id')
  async revokeEnrollmentToken(@Param('id') id: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const revoked = await this.enrollmentTokenService.revoke(id);
    if (revoked) {
      await this.auditService.log('DeviceEnrollmentToken', id, 'revoked', { actor });
    }
    return { ok: revoked };
  }

  private async resolveInstallerUrl(
    platform: AgentPlatform,
    baseUrl: string,
    meta: unknown,
  ): Promise<string | null> {
    const envKey =
      platform === 'windows'
        ? 'AGENT_INSTALLER_URL_WINDOWS'
        : platform === 'macos'
          ? 'AGENT_INSTALLER_URL_MACOS'
          : 'AGENT_INSTALLER_URL_LINUX';
    const legacy = platform === 'windows' ? process.env.AGENT_INSTALLER_URL?.trim() : undefined;
    return (
      process.env[envKey]?.trim() ||
      legacy ||
      (meta ? `${baseUrl}/devices/agent/installer?platform=${platform}` : null)
    );
  }

  // Public — fetched by `curl`/`irm` from the copy-paste install snippet
  // itself, which runs on the freshly imaged target host before any admin
  // session exists there. Protected purely by possessing an unguessable,
  // 10-minute-lived code minted per-view of the setup panel (see
  // AgentBootstrapService) — never by a long-lived secret, so there is
  // nothing here worth capturing from shell history or a process listing.
  @Get('/agent/bootstrap/:code/:platform')
  async agentBootstrapScript(
    @Param('code') code: string,
    @Param('platform') platform: AgentPlatform,
    @Res() res: Response,
  ) {
    const entry = this.agentBootstrapService.redeem(code);
    if (!entry) {
      res
        .status(410)
        .type('text/plain')
        .send(
          '# Bootstrap link expired or already used. Re-open Settings > Agent for a fresh command.\n',
        );
      return;
    }

    const meta = await this.agentInstallerService.getMeta(platform);
    const installerUrl = await this.resolveInstallerUrl(platform, entry.baseUrl, meta);
    if (!installerUrl) {
      res.status(404).type('text/plain').send('# No installer configured for this platform.\n');
      return;
    }

    let script: string;
    if (platform === 'windows') {
      // Write backend_url/token to a per-user temp file and pass
      // /CONFIGFILE=<path> instead of /BACKENDURL=/TOKEN= — keeps the
      // secret out of installer.exe's own argv (Task Manager / Process
      // Explorer show that to anyone with access to the host). The file
      // itself is deleted right after the installer reads it.
      const cfgJson = JSON.stringify({
        backend_url: entry.baseUrl,
        enrollment_token: entry.token,
      });
      // Single-quoted PowerShell string literal: only `'` needs escaping
      // (doubled) — backslashes/`$`/backticks are all literal inside one.
      const cfgJsonPs = cfgJson.replace(/'/g, "''");
      script =
        `$ErrorActionPreference = "Stop"\n` +
        `$cfg = Join-Path $env:TEMP "infrapilot-enroll.json"\n` +
        `[System.IO.File]::WriteAllText($cfg, '${cfgJsonPs}', [System.Text.UTF8Encoding]::new($false))\n` +
        `Invoke-WebRequest -Uri "${installerUrl}" -OutFile "$env:TEMP\\InfraPilotAgentSetup.exe"\n` +
        `& "$env:TEMP\\InfraPilotAgentSetup.exe" /SILENT /CONFIGFILE="$cfg"\n` +
        `Remove-Item $cfg -Force -ErrorAction SilentlyContinue\n`;
    } else if (platform === 'macos') {
      script =
        `set -euo pipefail\n` +
        `curl -fsSL "${installerUrl}" -o /tmp/InfraPilotAgentSetup.pkg\n` +
        `export BACKEND_URL="${entry.baseUrl}"\n` +
        `export ENROLL_TOKEN="${entry.token}"\n` +
        `installer -pkg /tmp/InfraPilotAgentSetup.pkg -target /\n`;
    } else {
      // Prefer the GPG signature (proves the .deb came from our build
      // pipeline) over the plain checksum (only proves it wasn't corrupted
      // in transit) — both only apply when we resolved the self-hosted URL,
      // since the hash/signature on file are for that exact upload; an
      // external AGENT_INSTALLER_URL_LINUX may point at a different build.
      const isSelfHosted = !process.env.AGENT_INSTALLER_URL_LINUX?.trim();
      const linuxMetaTyped = meta as { sha256?: string; signature?: string | null } | null;
      const sha256 = isSelfHosted ? linuxMetaTyped?.sha256 : null;
      const signature = isSelfHosted ? linuxMetaTyped?.signature : null;

      let verificationStep: string;
      if (signature) {
        const signatureUrl = `${entry.baseUrl}/devices/agent/installer?platform=linux&format=signature`;
        verificationStep =
          `curl -fsSL "${signatureUrl}" -o /tmp/InfraPilotAgentSetup.deb.sig\n` +
          `INFRAPILOT_GPG_HOME="$(mktemp -d)"\n` +
          `export GNUPGHOME="$INFRAPILOT_GPG_HOME"\n` +
          `gpg --batch --quiet --import <<'INFRAPILOT_PUBKEY_EOF'\n` +
          LINUX_PACKAGE_SIGNING_PUBLIC_KEY +
          `INFRAPILOT_PUBKEY_EOF\n` +
          `gpg --batch --verify /tmp/InfraPilotAgentSetup.deb.sig /tmp/InfraPilotAgentSetup.deb || ` +
          `{ echo "Signature verification failed — refusing to install" >&2; rm -rf "$INFRAPILOT_GPG_HOME"; exit 1; }\n` +
          `rm -rf "$INFRAPILOT_GPG_HOME"\n`;
      } else if (sha256) {
        verificationStep =
          `echo "${sha256}  /tmp/InfraPilotAgentSetup.deb" | sha256sum -c - || { echo "Checksum verification failed — refusing to install" >&2; exit 1; }\n`;
      } else {
        verificationStep = '';
      }

      script =
        `set -euo pipefail\n` +
        `curl -fsSL "${installerUrl}" -o /tmp/InfraPilotAgentSetup.deb\n` +
        verificationStep +
        `export BACKEND_URL="${entry.baseUrl}"\n` +
        `export ENROLL_TOKEN="${entry.token}"\n` +
        `dpkg -i /tmp/InfraPilotAgentSetup.deb\n`;
    }
    res.type('text/plain').send(script);
  }

  // Public — a freshly imaged host has no credentials yet, so the download
  // itself can't require auth. The binary is a generic installer; secrets
  // are only passed in at install time via CLI args / env vars (see
  // WindowsAgent.tsx). Defaults to windows for backward compat with any
  // already-shared URL that predates the `?platform=` param.
  @Get('/agent/installer')
  async downloadAgentInstaller(
    @Res() res: Response,
    @Query('platform') platform: AgentPlatform = 'windows',
    @Query('format') format?: string,
  ) {
    if (format === 'signature') {
      const meta = await this.agentInstallerService.getMeta(platform);
      if (!meta?.signature) {
        res.status(404).type('text/plain').send('No signature on file for this platform.\n');
        return;
      }
      res.type('text/plain').send(meta.signature);
      return;
    }

    const { stream, meta } = await this.agentInstallerService.getFileStream(platform);
    const fallbackName =
      platform === 'macos' ? 'InfraPilotAgentSetup.pkg' :
      platform === 'linux' ? 'InfraPilotAgentSetup.deb' :
      'InfraPilotAgentSetup.exe';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(meta.originalName || fallbackName)}"`,
    );
    stream.pipe(res);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/agent/installer')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
      ],
      { limits: { fileSize: 200 * 1024 * 1024 } },
    ),
  )
  async uploadAgentInstaller(
    @UploadedFiles() files: { file?: any[]; signature?: any[] },
    @Req() req: any,
    @Body('platform') platform: AgentPlatform = 'windows',
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const meta = await this.agentInstallerService.upload(
      files.file?.[0],
      platform,
      actor,
      files.signature?.[0],
    );
    await this.auditService.log('Device', null, 'agent_installer_uploaded', {
      actor,
      platform,
      originalName: meta.originalName,
      sizeBytes: meta.sizeBytes,
      signed: !!meta.signature,
    });
    return meta;
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/report.pdf')
  async deviceReportPdf(
    @Param('deviceId') deviceId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const actor =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? undefined;
    const { buffer, filename, sha256 } =
      await this.deviceReport.render(deviceId, actor);
    await this.auditService.log('Device', deviceId, 'report_exported', {
      actor,
      format: 'pdf',
      sha256,
      bytes: buffer.length,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('X-Report-Sha256', sha256);
    res.send(buffer);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/user/:userId/handover-form.docx')
  async userHandoverForm(
    @Param('userId') userId: string,
    @Query('lang') lang: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const actor =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? undefined;
    const { buffer, filename, sha256 } =
      await this.handoverForm.renderForUser(userId, lang);
    await this.auditService.log('User', userId, 'handover_form_exported', {
      actor,
      format: 'docx',
      lang,
      sha256,
      bytes: buffer.length,
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('X-Report-Sha256', sha256);
    res.send(buffer);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/scans')
  listScans(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.devicesService.listScans(deviceId, limit ? Number(limit) : 50);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/scans/diff')
  diffScans(
    @Param('deviceId') deviceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (from && to) {
      return this.devicesService.diffScans(deviceId, from, to);
    }
    return this.devicesService.diffLatestTwo(deviceId);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/scans/:scanId')
  getScan(
    @Param('deviceId') deviceId: string,
    @Param('scanId') scanId: string,
  ) {
    return this.devicesService.getScan(deviceId, scanId);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/software')
  async getDeviceSoftware(
    @Param('deviceId') deviceId: string,
    @Query('includeUninstalled') includeUninstalled?: string,
  ) {
    return this.devicesService.softwareForDevice(
      deviceId,
      includeUninstalled === 'true',
    );
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Patch('/:deviceId/lifecycle')
  async updateLifecycle(
    @Param('deviceId') deviceId: string,
    @Body() body: UpdateDeviceLifecycleDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const { previous, updated } =
      await this.devicesService.updateLifecycle(deviceId, body);

    await this.auditService.log('Device', deviceId, 'lifecycle_updated', {
      actor,
      changes: Object.fromEntries(
        Object.entries(body).filter(
          ([k, v]) =>
            v !== undefined && (previous as any)[k] !== v,
        ),
      ),
    });

    return updated;
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Patch('/:deviceId/details')
  async updateDetails(
    @Param('deviceId') deviceId: string,
    @Body() body: UpdateDeviceDetailsDto,
  ) {
    const updated = await this.devicesService.updateDetails(deviceId, body);
    await this.auditService.log('Device', deviceId, 'details_updated', {
      changes: body,
    });
    return updated;
  }

  @UseGuards(AuthGuard)
  @Get('/:deviceId/tags')
  tagsForDevice(@Param('deviceId') deviceId: string) {
    return this.tagsService.tagsForDevice(deviceId);
  }

  // ---- Mass actions ----

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Helpdesk)
  @Post('/bulk/tag')
  async bulkTag(
    @Body() body: BulkTagActionDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const count =
      body.action === 'detach'
        ? await this.tagsService.detach(body.deviceIds, body.tagIds)
        : await this.tagsService.attach(body.deviceIds, body.tagIds, actor);
    await this.auditService.log('Device', null, `tag_${body.action}`, {
      actor,
      deviceCount: body.deviceIds.length,
      deviceIds: body.deviceIds,
      tagIds: body.tagIds,
      affected: count,
    });
    return { affected: count };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/bulk/assign')
  async bulkAssign(
    @Body() body: BulkAssignDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const count = await this.devicesService.bulkAssignUser(
      body.deviceIds,
      body.userId,
    );
    await this.auditService.log('Device', null, 'assigned', {
      actor,
      deviceCount: body.deviceIds.length,
      userId: body.userId,
      affected: count,
    });
    return { affected: count };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/bulk/lifecycle')
  async bulkLifecycle(
    @Body() body: BulkLifecycleDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const count = await this.devicesService.bulkUpdateLifecycle(
      body.deviceIds,
      body.lifecycle,
      body.note ?? null,
    );
    await this.auditService.log('Device', null, 'lifecycle_updated', {
      actor,
      deviceCount: body.deviceIds.length,
      lifecycle: body.lifecycle,
      affected: count,
    });
    return { affected: count };
  }

  // ---- Agent task queue ----

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Helpdesk)
  @Post('/bulk/tasks')
  async enqueueBulkTasks(
    @Body() body: EnqueueBulkTasksDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const count = await this.agentTasks.enqueueBulk({ ...body, requestedBy: actor });
    await this.auditService.log('AgentTask', null, 'enqueued', {
      actor,
      deviceCount: body.deviceIds.length,
      type: body.type,
      created: count,
    });
    return { created: count };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Auditor, Role.Helpdesk)
  @Get('/:deviceId/tasks')
  listTasks(@Param('deviceId') deviceId: string, @Query('state') state?: any) {
    return this.agentTasks.listForDevice(deviceId, { state });
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin, Role.Helpdesk)
  @Post('/:deviceId/tasks')
  async enqueueTask(
    @Param('deviceId') deviceId: string,
    @Body() body: EnqueueTaskDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const task = await this.agentTasks.enqueue({
      deviceId,
      type: body.type,
      payload: body.payload,
      requestedBy: actor,
    });
    await this.auditService.log('AgentTask', task.id, 'enqueued', {
      actor,
      deviceId,
      type: body.type,
    });
    return task;
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/tasks/:id/cancel')
  async cancelTask(@Param('id') id: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
    const task = await this.agentTasks.cancel(id);
    await this.auditService.log('AgentTask', id, 'cancelled', { actor });
    return task;
  }

  // Agent-facing task queue endpoints. Authenticated via AgentGuard (HMAC)
  // against the device's credentials.

  @UseGuards(AgentGuard)
  @Post('/agent/tasks/claim')
  async claimTasks(@Body() body: ClaimTasksDto, @Req() req: any) {
    const device = (req as any).agentDevice;
    const tasks = await this.agentTasks.claimForDevice(
      device.id,
      body?.max ?? 5,
    );
    return tasks.map((t) => ({
      id: t.id,
      type: t.type,
      payload: t.payload,
      leaseToken: t.leaseToken,
      leasedUntil: t.leasedUntil,
    }));
  }

  @UseGuards(AgentGuard)
  @Post('/agent/tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() body: CompleteTaskDto,
  ) {
    return this.agentTasks.complete(id, body.leaseToken, body.result ?? null);
  }

  @UseGuards(AgentGuard)
  @Post('/agent/tasks/:id/fail')
  async failTask(
    @Param('id') id: string,
    @Body() body: FailTaskDto,
  ) {
    return this.agentTasks.fail(id, body.leaseToken, body.error ?? 'unknown');
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/:deviceId/agent/secret')
  async rotateAgentSecret(
    @Param('deviceId') deviceId: string,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const { secret } = await this.devicesService.rotateAgentSecret(deviceId);
    await this.auditService.log('Device', deviceId, 'agent_secret_rotated', {
      actor,
    });
    return { secret };
  }

  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @Post('/:deviceId/agent/secret/revoke')
  async revokeAgentSecret(
    @Param('deviceId') deviceId: string,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    await this.devicesService.revokeAgentSecret(deviceId);
    await this.auditService.log('Device', deviceId, 'agent_secret_revoked', {
      actor,
    });
    return { ok: true };
  }
}
