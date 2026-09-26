import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiSettingsService, ALL_AI_SURFACES } from './aiSettings.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';

describe('AiSettingsService', () => {
  let service: AiSettingsService;
  let repo: jest.Mocked<any>;
  const originalEnv = process.env.OPENAI_MODEL;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (r: any) => r),
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSettingsService,
        { provide: getRepositoryToken(AdminSettings), useValue: repo },
      ],
    }).compile();

    service = module.get<AiSettingsService>(AiSettingsService);
    delete process.env.OPENAI_MODEL;
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalEnv;
  });

  describe('getConfig', () => {
    it('defaults to an empty model, every surface enabled, and no space when no row exists yet', async () => {
      const config = await service.getConfig();
      expect(config).toEqual({
        model: '',
        enabledSurfaces: ALL_AI_SURFACES,
        knowledgeSpaceId: '',
      });
    });

    it('reads back a previously saved value', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: {
          model: 'gpt-5.6-luna',
          enabledSurfaces: ['adminTicketAssist'],
          knowledgeSpaceId: 'space-1',
        },
      });
      const config = await service.getConfig();
      expect(config).toEqual({
        model: 'gpt-5.6-luna',
        enabledSurfaces: ['adminTicketAssist'],
        knowledgeSpaceId: 'space-1',
      });
    });

    it('drops unknown surface values instead of trusting a stale/corrupt row', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { enabledSurfaces: ['adminTicketAssist', 'somethingRemoved'] },
      });
      const config = await service.getConfig();
      expect(config.enabledSurfaces).toEqual(['adminTicketAssist']);
    });
  });

  describe('saveConfig', () => {
    it('inserts a new row when none exists', async () => {
      const result = await service.saveConfig({
        model: 'gpt-5.6-terra',
        enabledSurfaces: ['logAnalysis'],
      });

      expect(repo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'ai_config',
          value: {
            model: 'gpt-5.6-terra',
            enabledSurfaces: ['logAnalysis'],
            knowledgeSpaceId: '',
          },
        }),
      );
      expect(result).toEqual({
        model: 'gpt-5.6-terra',
        enabledSurfaces: ['logAnalysis'],
        knowledgeSpaceId: '',
      });
    });

    it('updates the existing row instead of inserting a duplicate', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { model: '', enabledSurfaces: ALL_AI_SURFACES, knowledgeSpaceId: '' },
      });

      await service.saveConfig({ model: 'gpt-5.6-sol' });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          value: { model: 'gpt-5.6-sol', enabledSurfaces: ALL_AI_SURFACES, knowledgeSpaceId: '' },
        }),
      );
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('leaves enabledSurfaces untouched when only the model is passed in', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { model: '', enabledSurfaces: ['adminTicketAssist'], knowledgeSpaceId: '' },
      });

      const result = await service.saveConfig({ model: 'gpt-5.6-luna' });
      expect(result).toEqual({
        model: 'gpt-5.6-luna',
        enabledSurfaces: ['adminTicketAssist'],
        knowledgeSpaceId: '',
      });
    });

    it('saves and reads back knowledgeSpaceId independently of other fields', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { model: 'gpt-5.6-luna', enabledSurfaces: ALL_AI_SURFACES, knowledgeSpaceId: '' },
      });

      const result = await service.saveConfig({ knowledgeSpaceId: 'space-99' });
      expect(result).toEqual({
        model: 'gpt-5.6-luna',
        enabledSurfaces: ALL_AI_SURFACES,
        knowledgeSpaceId: 'space-99',
      });
    });
  });

  describe('isSurfaceEnabled', () => {
    it('is true for every surface by default', async () => {
      for (const surface of ALL_AI_SURFACES) {
        expect(await service.isSurfaceEnabled(surface)).toBe(true);
      }
    });

    it('is false once a surface has been turned off', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { model: '', enabledSurfaces: ['adminTicketAssist'] },
      });
      expect(await service.isSurfaceEnabled('userTicketAssist')).toBe(false);
      expect(await service.isSurfaceEnabled('adminTicketAssist')).toBe(true);
    });
  });

  describe('resolveModel', () => {
    it('falls back to the hardcoded default when nothing is configured', async () => {
      expect(await service.resolveModel()).toBe('gpt-6-astra');
    });

    it('falls back to OPENAI_MODEL when the DB has no model set', async () => {
      process.env.OPENAI_MODEL = 'gpt-5.6-terra';
      expect(await service.resolveModel()).toBe('gpt-5.6-terra');
    });

    it('prefers the DB-configured model over OPENAI_MODEL', async () => {
      process.env.OPENAI_MODEL = 'gpt-5.6-terra';
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'ai_config',
        value: { model: 'gpt-5.6-luna', enabledSurfaces: ALL_AI_SURFACES },
      });
      expect(await service.resolveModel()).toBe('gpt-5.6-luna');
    });
  });
});
