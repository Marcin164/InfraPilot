import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShiftsService } from './shifts.service';
import { Shift } from 'src/entities/shift.entity';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let repo: jest.Mocked<any>;
  let queryBuilder: jest.Mocked<any>;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn((v: any) => v),
      save: jest.fn().mockImplementation((s: any) => Promise.resolve({ id: 'new-shift', ...s })),
      findOneBy: jest.fn(),
      remove: jest.fn().mockImplementation((s: any) => Promise.resolve(s)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftsService, { provide: getRepositoryToken(Shift), useValue: repo }],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  describe('create', () => {
    const dto = {
      userId: 'user-1',
      type: 'Work',
      startDate: '2026-09-08',
      endDate: '2026-09-09',
    };

    it('rejects a shift whose dates overlap an existing shift for the same user', async () => {
      queryBuilder.getOne.mockResolvedValue({ id: 'existing-shift' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates the shift when no overlapping shift exists for the user', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      const shift = await service.create(dto);

      expect(repo.save).toHaveBeenCalled();
      expect(shift.userId).toBe('user-1');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the shift does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('missing-id', {comment: 'hi'})).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('updates only the fields provided, leaving others untouched', async () => {
      repo.findOneBy.mockResolvedValue({id: 's1', type: 'Work', comment: 'old comment'});

      const shift = await service.update('s1', {comment: 'new comment'});

      expect(shift.type).toBe('Work');
      expect(shift.comment).toBe('new comment');
    });

    it('rejects a date edit that overlaps another shift for the same user', async () => {
      repo.findOneBy.mockResolvedValue({id: 's1', userId: 'user-1', startDate: new Date('2026-09-08'), endDate: new Date('2026-09-09')});
      queryBuilder.getOne.mockResolvedValue({id: 'other-shift'});

      await expect(service.update('s1', {startDate: '2026-09-08T10:00:00.000Z'})).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('excludes the shift itself from the overlap check when editing its own dates', async () => {
      repo.findOneBy.mockResolvedValue({id: 's1', userId: 'user-1', startDate: new Date('2026-09-08'), endDate: new Date('2026-09-09')});
      queryBuilder.getOne.mockResolvedValue(null);

      await service.update('s1', {startDate: '2026-09-08T10:00:00.000Z'});

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('shift.id != :excludeId', {excludeId: 's1'});
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the shift does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('removes an existing shift', async () => {
      repo.findOneBy.mockResolvedValue({id: 's1'});

      const result = await service.remove('s1');

      expect(repo.remove).toHaveBeenCalled();
      expect(result).toEqual({id: 's1'});
    });
  });
});
