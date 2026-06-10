import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Users } from 'src/entities/users.entity';

// ─── External mocks ──────────────────────────────────────────────────────────

const mockCreatePropelAuthUser = jest.fn();
const mockFetchUserMetadataByEmail = jest.fn();
const mockFetchUserMetadataByUserId = jest.fn();
const mockLogoutAllUserSessions = jest.fn();
const mockValidateSod = jest.fn().mockReturnValue([]);

jest.mock('src/helpers/propelAuthClient', () => ({
  createUser: (...args: any[]) => mockCreatePropelAuthUser(...args),
  fetchUserMetadataByEmail: (...args: any[]) => mockFetchUserMetadataByEmail(...args),
  fetchUserMetadataByUserId: (...args: any[]) => mockFetchUserMetadataByUserId(...args),
  logoutAllUserSessions: (...args: any[]) => mockLogoutAllUserSessions(...args),
  propelAuth: {},
}));

jest.mock('src/config/sod', () => ({
  validateSod: (...args: any[]) => mockValidateSod(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<Users> = {}): Users =>
  ({
    id: 'user-1',
    name: 'Jan',
    surname: 'Kowalski',
    email: 'jan@acme.com',
    authUserId: 'auth-1',
    isAdmin: false,
    isApprover: false,
    isAuditor: false,
    isCompliance: false,
    isHelpdesk: false,
    isDpo: false,
    ...overrides,
  } as Users);

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockValidateSod.mockReturnValue([]);

    const selectQb: any = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
    };

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockResolvedValue({ identifiers: [{ id: 'user-1' }] }),
      save: jest.fn(async (u: any) => u),
      preload: jest.fn().mockResolvedValue(makeUser()),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(selectQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ─────────────────────────────────────────
  // findAll / findUser
  // ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns all users from repository', async () => {
      const users = [makeUser()];
      repo.find.mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toBe(users);
    });
  });

  describe('findUser', () => {
    it('returns user by id', async () => {
      const user = makeUser();
      repo.findOneBy.mockResolvedValue(user);
      const result = await service.findUser('user-1');
      expect(result).toBe(user);
    });
  });

  // ─────────────────────────────────────────
  // insertOne
  // ─────────────────────────────────────────

  describe('insertOne', () => {
    it('inserts user and returns result', async () => {
      const insertResult = { identifiers: [{ id: 'user-new' }] };
      repo.insert.mockResolvedValue(insertResult);

      const result = await service.insertOne({ name: 'Anna', surname: 'Nowak', email: 'anna@acme.com' });
      expect(result).toBe(insertResult);
      expect(repo.insert).toHaveBeenCalled();
    });

    it('uses provided id when given', async () => {
      await service.insertOne({ id: 'custom-id', name: 'X', surname: 'Y' });
      const insertedArg = repo.insert.mock.calls[0][0];
      expect(insertedArg.id).toBe('custom-id');
    });

    it('generates uuid when id is not provided', async () => {
      await service.insertOne({ name: 'X', surname: 'Y' });
      const insertedArg = repo.insert.mock.calls[0][0];
      expect(insertedArg.id).toBeDefined();
      expect(typeof insertedArg.id).toBe('string');
    });
  });

  // ─────────────────────────────────────────
  // insertMany
  // ─────────────────────────────────────────

  describe('insertMany', () => {
    it('throws when input is empty', async () => {
      await expect(service.insertMany([])).rejects.toThrow(Error);
    });

    it('inserts all provided users', async () => {
      const users = [
        { name: 'A', surname: 'B' },
        { name: 'C', surname: 'D' },
      ];
      await service.insertMany(users);
      const insertedArg = repo.insert.mock.calls[0][0];
      expect(insertedArg).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when user does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update({ name: 'X' }, 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on SOD violation', async () => {
      repo.findOneBy.mockResolvedValue(makeUser());
      mockValidateSod.mockReturnValue([{ role1: 'isAdmin', role2: 'isAuditor' }]);

      await expect(service.update({ isAdmin: true }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('saves updated user and returns it', async () => {
      const existing = makeUser();
      const updated = { ...existing, name: 'Updated' };
      repo.findOneBy.mockResolvedValue(existing);
      repo.preload.mockResolvedValue(updated as any);
      repo.save.mockResolvedValue(updated as any);

      const result = await service.update({ name: 'Updated' }, 'user-1');
      expect(result).toBe(updated);
    });

    it('logs out all sessions when a role field changes', async () => {
      const existing = makeUser({ isAdmin: false, authUserId: 'auth-1' });
      const updated = { ...existing, isAdmin: true };
      repo.findOneBy.mockResolvedValue(existing);
      repo.preload.mockResolvedValue(updated as any);
      repo.save.mockResolvedValue(updated as any);
      mockLogoutAllUserSessions.mockResolvedValue(undefined);

      await service.update({ isAdmin: true }, 'user-1');

      expect(mockLogoutAllUserSessions).toHaveBeenCalledWith('auth-1');
    });

    it('does not call logout when no role fields changed', async () => {
      const existing = makeUser({ isAdmin: false });
      const updated = { ...existing, name: 'NewName' };
      repo.findOneBy.mockResolvedValue(existing);
      repo.preload.mockResolvedValue(updated as any);
      repo.save.mockResolvedValue(updated as any);

      await service.update({ name: 'NewName' }, 'user-1');

      expect(mockLogoutAllUserSessions).not.toHaveBeenCalled();
    });

    it('does not throw when logout fails (best-effort)', async () => {
      const existing = makeUser({ isAdmin: false, authUserId: 'auth-1' });
      const updated = { ...existing, isAdmin: true };
      repo.findOneBy.mockResolvedValue(existing);
      repo.preload.mockResolvedValue(updated as any);
      repo.save.mockResolvedValue(updated as any);
      mockLogoutAllUserSessions.mockRejectedValue(new Error('PropelAuth down'));

      await expect(service.update({ isAdmin: true }, 'user-1')).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────

  describe('delete', () => {
    it('calls repository delete with the given id', async () => {
      await service.delete('user-1');
      expect(repo.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });
  });

  // ─────────────────────────────────────────
  // findApprovers
  // ─────────────────────────────────────────

  describe('findApprovers', () => {
    it('returns only users with isApprover=true', async () => {
      const approvers = [makeUser({ isApprover: true })];
      repo.findBy.mockResolvedValue(approvers);

      const result = await service.findApprovers();

      expect(repo.findBy).toHaveBeenCalledWith({ isApprover: true });
      expect(result).toBe(approvers);
    });
  });

  // ─────────────────────────────────────────
  // resolveAuthIdToUserId
  // ─────────────────────────────────────────

  describe('resolveAuthIdToUserId', () => {
    it('finds user by authUserId', async () => {
      const user = makeUser();
      repo.findOneBy.mockResolvedValue(user);

      const result = await service.resolveAuthIdToUserId('auth-1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ authUserId: 'auth-1' });
      expect(result).toBe(user);
    });
  });

  // ─────────────────────────────────────────
  // linkAuthByEmail
  // ─────────────────────────────────────────

  describe('linkAuthByEmail', () => {
    it('throws NotFoundException when user is not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.linkAuthByEmail('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns linked:false when user has no email', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ email: null as any }));
      const result = await service.linkAuthByEmail('user-1');
      expect(result.linked).toBe(false);
      expect(result.reason).toBe('no email on user');
    });

    it('returns linked:true when user is already linked', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: 'existing-auth' }));
      const result = await service.linkAuthByEmail('user-1');
      expect(result.linked).toBe(true);
      expect(result.authUserId).toBe('existing-auth');
    });

    it('links user when PropelAuth returns matching account', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: null as any }));
      mockFetchUserMetadataByEmail.mockResolvedValue({ userId: 'new-auth-id' });

      const result = await service.linkAuthByEmail('user-1');

      expect(result.linked).toBe(true);
      expect(result.authUserId).toBe('new-auth-id');
      expect(repo.save).toHaveBeenCalled();
    });

    it('returns linked:false when no PropelAuth user exists for email', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: null as any }));
      mockFetchUserMetadataByEmail.mockResolvedValue(null);

      const result = await service.linkAuthByEmail('user-1');
      expect(result.linked).toBe(false);
    });

    it('returns linked:false when PropelAuth throws', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: null as any }));
      mockFetchUserMetadataByEmail.mockRejectedValue(new Error('network'));

      const result = await service.linkAuthByEmail('user-1');
      expect(result.linked).toBe(false);
    });
  });

  // ─────────────────────────────────────────
  // provisionInAuth
  // ─────────────────────────────────────────

  describe('provisionInAuth', () => {
    it('throws NotFoundException when user is not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.provisionInAuth('ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user has no email', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ email: null as any }));
      await expect(service.provisionInAuth('user-1')).rejects.toThrow(BadRequestException);
    });

    it('returns existing authUserId without creating a new account', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: 'existing' }));
      const result = await service.provisionInAuth('user-1');
      expect(result.created).toBe(false);
      expect(result.authUserId).toBe('existing');
    });

    it('creates PropelAuth account and links it when no existing account', async () => {
      // findOneBy for initial lookup — user without authUserId
      repo.findOneBy
        .mockResolvedValueOnce(makeUser({ authUserId: null as any })) // provisionInAuth main lookup
        .mockResolvedValueOnce(makeUser({ authUserId: null as any })) // linkAuthByEmail inner lookup
        .mockResolvedValueOnce(makeUser({ authUserId: null as any })); // possibly another lookup

      // linkAuthByEmail will check PropelAuth — return null so it falls through to create
      mockFetchUserMetadataByEmail.mockResolvedValue(null);
      mockCreatePropelAuthUser.mockResolvedValue({ userId: 'fresh-auth-id' });

      const result = await service.provisionInAuth('user-1');

      expect(result.created).toBe(true);
      expect(result.authUserId).toBe('fresh-auth-id');
    });
  });

  // ─────────────────────────────────────────
  // verifyAuthLink
  // ─────────────────────────────────────────

  describe('verifyAuthLink', () => {
    it('throws NotFoundException when user is not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.verifyAuthLink('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns valid:false when user has no authUserId', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: null as any }));
      const result = await service.verifyAuthLink('user-1');
      expect(result.valid).toBe(false);
    });

    it('returns valid:true when PropelAuth confirms the user', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: 'auth-1' }));
      mockFetchUserMetadataByUserId.mockResolvedValue({ userId: 'auth-1', email: 'jan@acme.com' });

      const result = await service.verifyAuthLink('user-1');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('jan@acme.com');
    });

    it('returns valid:false when PropelAuth throws', async () => {
      repo.findOneBy.mockResolvedValue(makeUser({ authUserId: 'auth-1' }));
      mockFetchUserMetadataByUserId.mockRejectedValue(new Error('not found'));

      const result = await service.verifyAuthLink('user-1');
      expect(result.valid).toBe(false);
    });
  });
});
