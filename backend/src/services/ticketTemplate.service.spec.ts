import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketTemplateService } from './ticketTemplate.service';
import { TicketTemplate } from 'src/entities/ticketTemplate.entity';

const makeTemplate = (overrides: Partial<TicketTemplate> = {}): TicketTemplate =>
  ({
    id: 'tpl-1',
    name: 'VPN Reset',
    body: 'Please reset the VPN.',
    category: 'Network',
    shared: true,
    createdBy: 'user-1',
    ...overrides,
  } as TicketTemplate);

describe('TicketTemplateService', () => {
  let service: TicketTemplateService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (t: any) => t),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketTemplateService,
        { provide: getRepositoryToken(TicketTemplate), useValue: repo },
      ],
    }).compile();

    service = module.get<TicketTemplateService>(TicketTemplateService);
  });

  describe('listForUser', () => {
    it('filters to shared templates when userId is null', async () => {
      await service.listForUser(null);
      const qb = repo.createQueryBuilder();
      expect(qb.where).toHaveBeenCalledWith('t.shared = true');
    });

    it('includes shared and own templates when userId is provided', async () => {
      await service.listForUser('user-1');
      const qb = repo.createQueryBuilder();
      expect(qb.where).toHaveBeenCalledWith(
        't.shared = true OR t.createdBy = :userId',
        { userId: 'user-1' },
      );
    });
  });

  describe('create', () => {
    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create({ name: '', body: 'content' }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when body is empty', async () => {
      await expect(service.create({ name: 'TPL', body: '' }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('creates and saves a new template', async () => {
      await service.create({ name: 'VPN Reset', body: 'Please reset.' }, 'user-1');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('defaults category to general when not provided', async () => {
      await service.create({ name: 'TPL', body: 'Body' }, 'user-1');
      const created = repo.create.mock.calls[0][0];
      expect(created.category).toBe('general');
    });

    it('defaults shared to true', async () => {
      await service.create({ name: 'TPL', body: 'Body' }, 'user-1');
      const created = repo.create.mock.calls[0][0];
      expect(created.shared).toBe(true);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when template not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when non-owner tries to edit private template', async () => {
      repo.findOneBy.mockResolvedValue(makeTemplate({ shared: false, createdBy: 'owner' }));
      await expect(service.update('tpl-1', { name: 'X' }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('allows owner to edit private template', async () => {
      const tpl = makeTemplate({ shared: false, createdBy: 'user-1' });
      repo.findOneBy.mockResolvedValue(tpl);
      await service.update('tpl-1', { name: 'Updated' }, 'user-1');
      expect(repo.save).toHaveBeenCalled();
    });

    it('allows any user to edit shared template', async () => {
      repo.findOneBy.mockResolvedValue(makeTemplate({ shared: true }));
      await service.update('tpl-1', { name: 'Updated' }, 'user-99');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when template not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when non-owner tries to delete private template', async () => {
      repo.findOneBy.mockResolvedValue(makeTemplate({ shared: false, createdBy: 'owner' }));
      await expect(service.remove('tpl-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes the template', async () => {
      repo.findOneBy.mockResolvedValue(makeTemplate());
      await service.remove('tpl-1', 'user-1');
      expect(repo.delete).toHaveBeenCalledWith({ id: 'tpl-1' });
    });
  });
});
