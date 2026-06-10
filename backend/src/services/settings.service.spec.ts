import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { UserSettings } from 'src/entities/userSettings.entity';

const makeSettings = (overrides: Partial<UserSettings> = {}): UserSettings =>
  ({ id: 'set-1', userId: 'user-1', theme: 'dark', language: 'pl', ...overrides } as UserSettings);

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (s: any) => s),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(UserSettings), useValue: repo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('getUserSettings', () => {
    it('returns null when no settings exist for user', async () => {
      const result = await service.getUserSettings('user-1');
      expect(result).toBeNull();
    });

    it('returns settings when they exist', async () => {
      const settings = makeSettings();
      repo.findOne.mockResolvedValue(settings);
      const result = await service.getUserSettings('user-1');
      expect(result).toBe(settings);
    });
  });

  describe('updateUserSettings', () => {
    it('creates new settings when none exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.updateUserSettings('user-1', { theme: 'light' } as any);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', theme: 'light' }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('merges and saves when settings already exist', async () => {
      const existing = makeSettings();
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue(existing);

      await service.updateUserSettings('user-1', { theme: 'light' } as any);

      expect(repo.merge).toHaveBeenCalledWith(existing, { theme: 'light' });
      expect(repo.save).toHaveBeenCalledWith(existing);
    });

    it('returns the saved settings', async () => {
      const saved = makeSettings({ theme: 'light' as any });
      repo.findOne.mockResolvedValue(null);
      repo.save.mockResolvedValue(saved);

      const result = await service.updateUserSettings('user-1', { theme: 'light' } as any);
      expect(result).toBe(saved);
    });
  });
});
