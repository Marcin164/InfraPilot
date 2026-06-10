import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentGroupsService } from './assignmentGroups.service';
import { AssignmentGroup } from 'src/entities/assignmentGroup.entity';
import { Users } from 'src/entities/users.entity';

const makeGroup = (overrides: Partial<AssignmentGroup> = {}): AssignmentGroup =>
  ({
    id: 'group-1',
    name: 'First Line Support',
    description: 'Handles L1 tickets',
    members: [],
    ...overrides,
  } as AssignmentGroup);

const makeUser = (id = 'user-1'): Users =>
  ({ id, name: 'Jan', email: 'jan@acme.com' } as Users);

describe('AssignmentGroupsService', () => {
  let service: AssignmentGroupsService;
  let groupsRepo: jest.Mocked<any>;
  let usersRepo: jest.Mocked<any>;

  beforeEach(async () => {
    groupsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (g: any) => g),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    usersRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      findBy: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentGroupsService,
        { provide: getRepositoryToken(AssignmentGroup), useValue: groupsRepo },
        { provide: getRepositoryToken(Users), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<AssignmentGroupsService>(AssignmentGroupsService);
  });

  // ─────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns all groups ordered by name', async () => {
      const groups = [makeGroup()];
      groupsRepo.find.mockResolvedValue(groups);
      const result = await service.findAll();
      expect(result).toBe(groups);
      expect(groupsRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    });
  });

  // ─────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────

  describe('findOne', () => {
    it('returns the group when found', async () => {
      const group = makeGroup();
      groupsRepo.findOne.mockResolvedValue(group);
      const result = await service.findOne('group-1');
      expect(result).toBe(group);
    });

    it('throws NotFoundException when group does not exist', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────
  // findByName
  // ─────────────────────────────────────────

  describe('findByName', () => {
    it('returns group by name', async () => {
      const group = makeGroup();
      groupsRepo.findOne.mockResolvedValue(group);
      const result = await service.findByName('First Line Support');
      expect(result).toBe(group);
    });

    it('returns null when no group matches the name', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      const result = await service.findByName('Unknown');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────
  // findMembers
  // ─────────────────────────────────────────

  describe('findMembers', () => {
    it('throws NotFoundException when group is not found', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      await expect(service.findMembers('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns group members', async () => {
      const members = [makeUser()];
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members }));
      const result = await service.findMembers('group-1');
      expect(result).toEqual(members);
    });

    it('returns empty array when group has no members', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members: undefined as any }));
      const result = await service.findMembers('group-1');
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────
  // create
  // ─────────────────────────────────────────

  describe('create', () => {
    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when group name already exists', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup());
      await expect(service.create({ name: 'First Line Support' })).rejects.toThrow(BadRequestException);
    });

    it('creates and saves a new group', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      const result = await service.create({ name: 'New Group', description: 'Desc' });
      expect(groupsRepo.create).toHaveBeenCalled();
      expect(groupsRepo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('updates name and description and saves', async () => {
      const group = makeGroup();
      groupsRepo.findOne.mockResolvedValue(group);

      await service.update('group-1', { name: 'Updated', description: 'New desc' });

      expect(groupsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated', description: 'New desc' }),
      );
    });
  });

  // ─────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes the group and returns success', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup());
      const result = await service.delete('group-1');
      expect(groupsRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  // ─────────────────────────────────────────
  // setMembers
  // ─────────────────────────────────────────

  describe('setMembers', () => {
    it('sets members to an empty array when userIds is empty', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup());
      await service.setMembers('group-1', []);
      expect(groupsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ members: [] }),
      );
    });

    it('replaces members with the provided user list', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup());
      const users = [makeUser('user-1'), makeUser('user-2')];
      usersRepo.findBy.mockResolvedValue(users);

      await service.setMembers('group-1', ['user-1', 'user-2']);

      expect(groupsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ members: users }),
      );
    });
  });

  // ─────────────────────────────────────────
  // addMember
  // ─────────────────────────────────────────

  describe('addMember', () => {
    it('throws NotFoundException when user does not exist', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup());
      usersRepo.findOneBy.mockResolvedValue(null);
      await expect(service.addMember('group-1', 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('adds user to group members', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members: [] }));
      usersRepo.findOneBy.mockResolvedValue(makeUser());

      await service.addMember('group-1', 'user-1');

      expect(groupsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ members: [expect.objectContaining({ id: 'user-1' })] }),
      );
    });

    it('does not add duplicate member', async () => {
      const existingMember = makeUser();
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members: [existingMember] }));
      usersRepo.findOneBy.mockResolvedValue(existingMember);

      await service.addMember('group-1', 'user-1');

      const savedGroup = groupsRepo.save.mock.calls[0][0];
      expect(savedGroup.members).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────
  // removeMember
  // ─────────────────────────────────────────

  describe('removeMember', () => {
    it('removes the user from group members', async () => {
      const members = [makeUser('user-1'), makeUser('user-2')];
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members }));

      await service.removeMember('group-1', 'user-1');

      const savedGroup = groupsRepo.save.mock.calls[0][0];
      expect(savedGroup.members).toHaveLength(1);
      expect(savedGroup.members[0].id).toBe('user-2');
    });

    it('is a no-op when user is not a member', async () => {
      groupsRepo.findOne.mockResolvedValue(makeGroup({ members: [makeUser('user-2')] }));

      await service.removeMember('group-1', 'user-1');

      const savedGroup = groupsRepo.save.mock.calls[0][0];
      expect(savedGroup.members).toHaveLength(1);
    });
  });
});
