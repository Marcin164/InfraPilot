import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

const KEY = 'ai_config';

/**
 * Known-good OpenAI model choices surfaced in Settings > AI as a dropdown
 * (see ai.service.ts's own comment on why gpt-6-astra is the default).
 * '' means "use the default" -- resolveModel() falls through to the
 * OPENAI_MODEL env var and finally the hardcoded default, in that order.
 */
export const AI_MODEL_OPTIONS = [
  'gpt-6-astra',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
] as const;

/**
 * Every place in the app that can call into AiService. Each is an
 * independent on/off switch -- disabling one hides the corresponding button
 * in the UI (AIAssistPanel.tsx / TicketDiagnostics.tsx / New.tsx's
 * TicketAssistHelper) *and* is re-checked server-side (AiController /
 * TicketWorkflowService) so a stale page or a direct API call can't bypass
 * the toggle.
 */
export type AiSurface =
  | 'adminTicketAssist'
  | 'userTicketAssist'
  | 'logAnalysis'
  | 'ticketClosureSummary';

export const ALL_AI_SURFACES: AiSurface[] = [
  'adminTicketAssist',
  'userTicketAssist',
  'logAnalysis',
  'ticketClosureSummary',
];

export type AiConfig = {
  /** '' = use the OPENAI_MODEL env var, then the hardcoded default. */
  model: string;
  enabledSurfaces: AiSurface[];
  /**
   * Target KnowledgeSpace for articles auto-drafted by
   * TicketClosureSummaryListener. '' = auto -- the listener creates (once)
   * or reuses a space named "AI Generated" and writes its id back here, so
   * this works with zero setup and Settings > AI still shows which space is
   * actually being used after the first run.
   */
  knowledgeSpaceId: string;
};

const DEFAULT_CONFIG: AiConfig = {
  model: '',
  // On by default so upgrading doesn't silently turn off AI features that
  // already worked -- an admin opts out per-surface, not back in.
  enabledSurfaces: [...ALL_AI_SURFACES],
  knowledgeSpaceId: '',
};

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {}

  async getConfig(): Promise<AiConfig> {
    const record = await this.repo.findOne({ where: { key: KEY } });
    const value = (record?.value as Partial<AiConfig>) ?? {};
    return {
      model: value.model ?? DEFAULT_CONFIG.model,
      enabledSurfaces: Array.isArray(value.enabledSurfaces)
        ? value.enabledSurfaces.filter((s): s is AiSurface =>
            ALL_AI_SURFACES.includes(s as AiSurface),
          )
        : DEFAULT_CONFIG.enabledSurfaces,
      knowledgeSpaceId: value.knowledgeSpaceId ?? DEFAULT_CONFIG.knowledgeSpaceId,
    };
  }

  async saveConfig(input: Partial<AiConfig>): Promise<AiConfig> {
    const current = await this.getConfig();
    const value: AiConfig = {
      model: input.model ?? current.model,
      enabledSurfaces: Array.isArray(input.enabledSurfaces)
        ? input.enabledSurfaces.filter((s) => ALL_AI_SURFACES.includes(s))
        : current.enabledSurfaces,
      knowledgeSpaceId: input.knowledgeSpaceId ?? current.knowledgeSpaceId,
    };

    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = value;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: value as any });
    }
    return value;
  }

  /** True unless an admin explicitly turned this surface off. */
  async isSurfaceEnabled(surface: AiSurface): Promise<boolean> {
    const config = await this.getConfig();
    return config.enabledSurfaces.includes(surface);
  }

  /** DB setting (if non-empty) > OPENAI_MODEL env var > hardcoded default. */
  async resolveModel(): Promise<string> {
    const config = await this.getConfig();
    return config.model || process.env.OPENAI_MODEL || 'gpt-6-astra';
  }
}
