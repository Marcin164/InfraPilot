import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { Histories } from 'src/entities/histories.entity';
import { Applications } from 'src/entities/applications.entity';
import { KnowledgeArticle } from 'src/entities/knowledgeArticle.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { PurchaseOrder } from 'src/entities/purchaseOrder.entity';

// Every category permission granted -- used by tests that exercise the
// query/mapping logic itself, as opposed to the permission-gating tests
// below, which each grant a narrower subset on purpose.
const ALL_PERMS = new Set([
  'users.view',
  'devices.view',
  'helpdesk.tickets.access',
  'knowledge.view',
  'licenses.view',
  'procurement.view',
]);

describe('SearchService', () => {
  let service: SearchService;
  let usersRepo: jest.Mocked<any>;
  let devicesRepo: jest.Mocked<any>;
  let ticketsRepo: jest.Mocked<any>;
  let historiesRepo: jest.Mocked<any>;
  let applicationsRepo: jest.Mocked<any>;
  let knowledgeRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;
  let procurementRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const makeQb = () => ({
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    usersRepo = { find: jest.fn().mockResolvedValue([]) };
    devicesRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    ticketsRepo = { find: jest.fn().mockResolvedValue([]) };
    historiesRepo = { find: jest.fn().mockResolvedValue([]) };
    applicationsRepo = { createQueryBuilder: jest.fn().mockReturnValue(makeQb()) };
    knowledgeRepo = { find: jest.fn().mockResolvedValue([]) };
    licenseRepo = { find: jest.fn().mockResolvedValue([]) };
    procurementRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: getRepositoryToken(Histories), useValue: historiesRepo },
        { provide: getRepositoryToken(Applications), useValue: applicationsRepo },
        { provide: getRepositoryToken(KnowledgeArticle), useValue: knowledgeRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
        { provide: getRepositoryToken(PurchaseOrder), useValue: procurementRepo },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('searchAll', () => {
    it('returns empty results when query is blank', async () => {
      const result = await service.searchAll('', ALL_PERMS);
      expect(result.users).toEqual([]);
      expect(result.devices).toEqual([]);
      expect(result.tickets).toEqual([]);
      expect(result.histories).toEqual([]);
      expect(result.applications).toEqual([]);
    });

    it('returns empty results when query is only whitespace', async () => {
      const result = await service.searchAll('   ', ALL_PERMS);
      expect(result.users).toEqual([]);
    });

    it('maps user results to SearchResultItems', async () => {
      usersRepo.find.mockResolvedValue([
        { id: 'u-1', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com', username: 'jkowalski' },
      ]);
      const result = await service.searchAll('jan', ALL_PERMS);
      expect(result.users[0]).toMatchObject({
        id: 'u-1',
        type: 'user',
        title: 'Jan Kowalski',
        subtitle: 'jan@example.com',
        url: '/admin/users/u-1',
      });
    });

    it('maps device results to SearchResultItems', async () => {
      devicesRepo.find.mockResolvedValue([
        { id: 'd-1', assetName: 'PC-001', serialNumber: 'SN123', manufacturer: 'Dell', model: 'Latitude' },
      ]);
      const result = await service.searchAll('PC-001', ALL_PERMS);
      expect(result.devices[0]).toMatchObject({
        id: 'd-1',
        type: 'device',
        title: 'PC-001',
        url: '/admin/devices/d-1/system',
      });
    });

    it('maps ticket results to SearchResultItems', async () => {
      ticketsRepo.find.mockResolvedValue([
        { id: 't-1', number: 42, category: 'Network', description: 'VPN issue' },
      ]);
      const result = await service.searchAll('vpn', ALL_PERMS);
      expect(result.tickets[0]).toMatchObject({
        id: 't-1',
        type: 'ticket',
        url: '/admin/helpdesk/t-1',
      });
    });

    it('deduplicates device hits from structured and JSONB searches', async () => {
      const device = { id: 'd-1', assetName: 'PC', manufacturer: 'Dell', model: 'X', serialNumber: null, location: null };
      devicesRepo.find.mockResolvedValue([device]);
      devicesRepo.createQueryBuilder().getMany.mockResolvedValue([device]); // same device from JSONB
      const result = await service.searchAll('chrome', ALL_PERMS);
      expect(result.devices).toHaveLength(1); // deduped
    });

    it('does not call jsonb search for short terms (< 4 chars)', async () => {
      await service.searchAll('exe', ALL_PERMS);
      // createQueryBuilder is only called for applications, not devices jsonb
      expect(devicesRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // Per-category permission gating
  // ─────────────────────────────────────────

  describe('permission filtering', () => {
    it('excludes a category and never even queries it when the caller lacks the matching permission', async () => {
      usersRepo.find.mockResolvedValue([
        { id: 'u-1', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com', username: 'jkowalski' },
      ]);

      const result = await service.searchAll('jan', new Set());

      expect(result.users).toEqual([]);
      expect(usersRepo.find).not.toHaveBeenCalled();
    });

    it('includes a category once its matching permission is granted', async () => {
      usersRepo.find.mockResolvedValue([
        { id: 'u-1', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com', username: 'jkowalski' },
      ]);

      const result = await service.searchAll('jan', new Set(['users.view']));

      expect(result.users).toHaveLength(1);
    });

    it('defaults to no results in any category when granted is omitted (fail closed)', async () => {
      usersRepo.find.mockResolvedValue([
        { id: 'u-1', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com', username: 'jkowalski' },
      ]);

      const result = await service.searchAll('jan');

      expect(result.users).toEqual([]);
    });

    it('gates tickets on helpdesk.tickets.access independently of devices.view', async () => {
      ticketsRepo.find.mockResolvedValue([
        { id: 't-1', number: 1, category: 'Network', description: 'VPN issue' },
      ]);

      const result = await service.searchAll('vpn', new Set(['devices.view']));

      expect(result.tickets).toEqual([]);
      expect(ticketsRepo.find).not.toHaveBeenCalled();
    });

    it('gates knowledge, licenses and procurement each on their own permission', async () => {
      knowledgeRepo.find.mockResolvedValue([{ id: 'k-1', title: 'VPN setup', category: 'IT', spaceId: 's-1' }]);
      licenseRepo.find.mockResolvedValue([{ id: 'l-1', name: 'VPN Client', publisher: 'Acme', vendor: 'Acme' }]);
      procurementRepo.find.mockResolvedValue([{ id: 'p-1', title: 'VPN order', supplier: 'Acme' }]);

      const noneGranted = await service.searchAll('vpn', new Set());
      expect(noneGranted.knowledge).toEqual([]);
      expect(noneGranted.licenses).toEqual([]);
      expect(noneGranted.procurement).toEqual([]);

      const allGranted = await service.searchAll(
        'vpn',
        new Set(['knowledge.view', 'licenses.view', 'procurement.view']),
      );
      expect(allGranted.knowledge).toHaveLength(1);
      expect(allGranted.licenses).toHaveLength(1);
      expect(allGranted.procurement).toHaveLength(1);
    });
  });
});
