import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { Histories } from 'src/entities/histories.entity';
import { Applications } from 'src/entities/applications.entity';

describe('SearchService', () => {
  let service: SearchService;
  let usersRepo: jest.Mocked<any>;
  let devicesRepo: jest.Mocked<any>;
  let ticketsRepo: jest.Mocked<any>;
  let historiesRepo: jest.Mocked<any>;
  let applicationsRepo: jest.Mocked<any>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: getRepositoryToken(Histories), useValue: historiesRepo },
        { provide: getRepositoryToken(Applications), useValue: applicationsRepo },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('searchAll', () => {
    it('returns empty results when query is blank', async () => {
      const result = await service.searchAll('');
      expect(result.users).toEqual([]);
      expect(result.devices).toEqual([]);
      expect(result.tickets).toEqual([]);
      expect(result.histories).toEqual([]);
      expect(result.applications).toEqual([]);
    });

    it('returns empty results when query is only whitespace', async () => {
      const result = await service.searchAll('   ');
      expect(result.users).toEqual([]);
    });

    it('maps user results to SearchResultItems', async () => {
      usersRepo.find.mockResolvedValue([
        { id: 'u-1', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com', username: 'jkowalski' },
      ]);
      const result = await service.searchAll('jan');
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
      const result = await service.searchAll('PC-001');
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
      const result = await service.searchAll('vpn');
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
      const result = await service.searchAll('chrome');
      expect(result.devices).toHaveLength(1); // deduped
    });

    it('does not call jsonb search for short terms (< 4 chars)', async () => {
      await service.searchAll('exe');
      // createQueryBuilder is only called for applications, not devices jsonb
      expect(devicesRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
