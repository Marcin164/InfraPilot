import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SoftwareInventoryService, extractSoftwareList } from './softwareInventory.service';
import { Applications } from 'src/entities/applications.entity';
import { DevicesApplications } from 'src/entities/devicesApplications.entity';

describe('extractSoftwareList', () => {
  it('returns empty array for null input', () => {
    expect(extractSoftwareList(null)).toEqual([]);
  });

  it('returns empty array for non-object input', () => {
    expect(extractSoftwareList('not an object')).toEqual([]);
  });

  it('extracts software from a flat array of objects', () => {
    const sw = [{ name: 'Chrome', version: '120.0', publisher: 'Google' }];
    const result = extractSoftwareList(sw);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Chrome', version: '120.0', publisher: 'Google' });
  });

  it('extracts from nested structure using displayName fallback', () => {
    const sw = { installed: [{ DisplayName: 'MS Office', Version: '16.0' }] };
    const result = extractSoftwareList(sw);
    expect(result.find((s) => s.name === 'MS Office')).toBeDefined();
  });

  it('deduplicates by name+publisher+version key', () => {
    const sw = [
      { name: 'Chrome', version: '120.0' },
      { name: 'Chrome', version: '120.0' },
    ];
    const result = extractSoftwareList(sw);
    expect(result).toHaveLength(1);
  });

  it('includes installDate when present', () => {
    const sw = [{ name: 'Notepad++', version: '8.6', InstallDate: '20240101' }];
    const result = extractSoftwareList(sw);
    expect(result[0].installDate).toBe('20240101');
  });

  it('sets publisher to null when not present', () => {
    const sw = [{ name: 'App', version: '1.0' }];
    const result = extractSoftwareList(sw);
    expect(result[0].publisher).toBeNull();
  });
});

describe('SoftwareInventoryService', () => {
  let service: SoftwareInventoryService;
  let applicationsRepo: jest.Mocked<any>;
  let installsRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    applicationsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (a: any) => ({ id: 'app-1', ...a })),
    };
    installsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (i: any) => i),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftwareInventoryService,
        { provide: getRepositoryToken(Applications), useValue: applicationsRepo },
        { provide: getRepositoryToken(DevicesApplications), useValue: installsRepo },
      ],
    }).compile();

    service = module.get<SoftwareInventoryService>(SoftwareInventoryService);
  });

  describe('reconcileForDevice', () => {
    it('returns zero counts for empty observed list', async () => {
      installsRepo.find.mockResolvedValue([]);
      const result = await service.reconcileForDevice('dev-1', []);
      expect(result).toEqual({ added: 0, refreshed: 0, uninstalled: 0 });
    });

    it('adds new software to catalog and install table', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);
      installsRepo.find.mockResolvedValue([]);
      const result = await service.reconcileForDevice('dev-1', [
        { name: 'Chrome', publisher: 'Google', version: '120.0' },
      ]);
      expect(result.added).toBe(1);
    });

    it('refreshes already-installed software', async () => {
      const app = { id: 'app-1', nameKey: 'chrome', publisherKey: 'google' };
      applicationsRepo.findOne.mockResolvedValue(app);
      installsRepo.findOne.mockResolvedValue({ id: 'inst-1', lastSeenAt: null, uninstalledAt: null });
      installsRepo.find.mockResolvedValue([{ applicationId: 'app-1', version: '120.0' }]);
      const result = await service.reconcileForDevice('dev-1', [
        { name: 'Chrome', publisher: 'Google', version: '120.0' },
      ]);
      expect(result.refreshed).toBe(1);
    });

    it('marks uninstalled software', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-new', nameKey: 'notepad', publisherKey: '' });
      installsRepo.findOne.mockResolvedValue(null);
      // Existing install that won't be in observed list
      installsRepo.find.mockResolvedValue([
        { id: 'old-inst', applicationId: 'old-app', version: null, uninstalledAt: null },
      ]);
      const result = await service.reconcileForDevice('dev-1', [
        { name: 'Notepad', publisher: null, version: null },
      ]);
      expect(result.uninstalled).toBe(1);
    });
  });

  describe('forDevice', () => {
    it('queries installs for given device excluding uninstalled by default', async () => {
      await service.forDevice('dev-1');
      expect(installsRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('devicesForApplication', () => {
    it('finds installs for given application', async () => {
      const installs = [{ id: 'inst-1', applicationId: 'app-1' }];
      installsRepo.find.mockResolvedValue(installs);
      const result = await service.devicesForApplication('app-1');
      expect(result).toBe(installs);
    });
  });
});
