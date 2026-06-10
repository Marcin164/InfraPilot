import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeviceTagsService } from './deviceTags.service';
import { DeviceTag } from 'src/entities/deviceTag.entity';
import { DeviceTagMap } from 'src/entities/deviceTagMap.entity';

const makeTag = (overrides: any = {}): DeviceTag =>
  ({ id: 'tag-1', key: 'critical', label: 'Critical', color: '#ff0000', ...overrides } as DeviceTag);

const makeMap = (deviceId = 'device-1', tagId = 'tag-1'): DeviceTagMap =>
  ({ id: 'map-1', deviceId, tagId, tag: makeTag(), createdBy: 'admin' } as DeviceTagMap);

describe('DeviceTagsService', () => {
  let service: DeviceTagsService;
  let tagsRepo: jest.Mocked<any>;
  let mapRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const deleteQb: any = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    tagsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (t: any) => t),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mapRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (m: any) => m),
      createQueryBuilder: jest.fn().mockReturnValue(deleteQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceTagsService,
        { provide: getRepositoryToken(DeviceTag), useValue: tagsRepo },
        { provide: getRepositoryToken(DeviceTagMap), useValue: mapRepo },
      ],
    }).compile();

    service = module.get<DeviceTagsService>(DeviceTagsService);
  });

  describe('listTags', () => {
    it('returns all tags ordered by label', async () => {
      const tags = [makeTag()];
      tagsRepo.find.mockResolvedValue(tags);
      const result = await service.listTags();
      expect(result).toBe(tags);
      expect(tagsRepo.find).toHaveBeenCalledWith({ order: { label: 'ASC' } });
    });
  });

  describe('createTag', () => {
    it('throws BadRequestException when key is empty', async () => {
      await expect(service.createTag({ key: '', label: 'Critical' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when tag key already exists', async () => {
      tagsRepo.findOneBy.mockResolvedValue(makeTag());
      await expect(service.createTag({ key: 'critical', label: 'Critical' })).rejects.toThrow(BadRequestException);
    });

    it('creates tag with lowercased key', async () => {
      tagsRepo.findOneBy.mockResolvedValue(null);
      await service.createTag({ key: 'Critical', label: 'Critical' });
      expect(tagsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'critical' }),
      );
    });

    it('defaults color when not provided', async () => {
      tagsRepo.findOneBy.mockResolvedValue(null);
      await service.createTag({ key: 'new', label: 'New' });
      expect(tagsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#2B9AE9' }),
      );
    });
  });

  describe('deleteTag', () => {
    it('throws NotFoundException when tag not found', async () => {
      tagsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.deleteTag('ghost')).rejects.toThrow(NotFoundException);
    });

    it('deletes the tag', async () => {
      tagsRepo.findOneBy.mockResolvedValue(makeTag());
      await service.deleteTag('tag-1');
      expect(tagsRepo.delete).toHaveBeenCalledWith({ id: 'tag-1' });
    });
  });

  describe('tagsForDevice', () => {
    it('returns tags associated with the device', async () => {
      mapRepo.find.mockResolvedValue([makeMap()]);
      const result = await service.tagsForDevice('device-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tag-1');
    });
  });

  describe('devicesWithTags', () => {
    it('returns empty array when tagIds is empty', async () => {
      const result = await service.devicesWithTags([]);
      expect(result).toEqual([]);
      expect(mapRepo.find).not.toHaveBeenCalled();
    });

    it('returns deduplicated device IDs', async () => {
      mapRepo.find.mockResolvedValue([
        makeMap('d-1', 'tag-1'),
        makeMap('d-1', 'tag-2'), // same device, different tag
        makeMap('d-2', 'tag-1'),
      ]);
      const result = await service.devicesWithTags(['tag-1', 'tag-2']);
      expect(result).toHaveLength(2);
      expect(result).toContain('d-1');
      expect(result).toContain('d-2');
    });
  });

  describe('attach', () => {
    it('returns 0 when deviceIds is empty', async () => {
      const count = await service.attach([], ['tag-1'], 'admin');
      expect(count).toBe(0);
    });

    it('skips already existing mappings', async () => {
      mapRepo.findOne.mockResolvedValue(makeMap());
      const count = await service.attach(['device-1'], ['tag-1'], 'admin');
      expect(count).toBe(0);
      expect(mapRepo.save).not.toHaveBeenCalled();
    });

    it('creates new mappings and returns count', async () => {
      mapRepo.findOne.mockResolvedValue(null);
      const count = await service.attach(['d-1', 'd-2'], ['tag-1'], 'admin');
      expect(count).toBe(2);
      expect(mapRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('detach', () => {
    it('returns 0 when tagIds is empty', async () => {
      const count = await service.detach(['device-1'], []);
      expect(count).toBe(0);
    });

    it('executes delete query and returns affected count', async () => {
      mapRepo.createQueryBuilder().execute.mockResolvedValue({ affected: 3 });
      const count = await service.detach(['d-1'], ['tag-1']);
      expect(count).toBe(3);
    });
  });
});
