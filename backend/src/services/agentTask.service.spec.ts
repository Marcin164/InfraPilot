import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgentTaskService } from './agentTask.service';
import { AgentTask } from 'src/entities/agentTask.entity';

const makeTask = (overrides: Partial<AgentTask> = {}): AgentTask =>
  ({
    id: 'task-1',
    deviceId: 'device-1',
    type: 'scan',
    state: 'queued',
    leaseToken: null,
    leasedAt: null,
    leasedUntil: null,
    completedAt: null,
    result: null,
    attempts: 0,
    lastError: null,
    payload: null,
    requestedBy: null,
    ...overrides,
  } as AgentTask);

const buildQb = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  setLock: jest.fn().mockReturnThis(),
  setOnLocked: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
});

describe('AgentTaskService', () => {
  let service: AgentTaskService;
  let repo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  beforeEach(async () => {
    const qb = buildQb();

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (t: any) => t),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const transactionQb = buildQb();
    const txRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(transactionQb),
      save: jest.fn(async (t: any) => t),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: (em: any) => any) =>
        cb({ getRepository: jest.fn().mockReturnValue(txRepo) }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentTaskService,
        { provide: getRepositoryToken(AgentTask), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AgentTaskService>(AgentTaskService);
  });

  // ─────────────────────────────────────────
  // enqueue
  // ─────────────────────────────────────────

  describe('enqueue', () => {
    it('creates and saves a queued task', async () => {
      const task = makeTask();
      repo.save.mockResolvedValue(task);

      const result = await service.enqueue({ deviceId: 'device-1', type: 'scan' as any });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'device-1', state: 'queued', attempts: 0 }),
      );
      expect(result).toBe(task);
    });
  });

  // ─────────────────────────────────────────
  // enqueueBulk
  // ─────────────────────────────────────────

  describe('enqueueBulk', () => {
    it('returns 0 for empty device list', async () => {
      const count = await service.enqueueBulk({ deviceIds: [], type: 'scan' as any });
      expect(count).toBe(0);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('enqueues a task for each device', async () => {
      repo.save.mockImplementation(async (t: any) => t);
      const count = await service.enqueueBulk({
        deviceIds: ['d-1', 'd-2', 'd-3'],
        type: 'scan' as any,
      });
      expect(count).toBe(3);
      expect(repo.save).toHaveBeenCalledTimes(3);
    });
  });

  // ─────────────────────────────────────────
  // complete
  // ─────────────────────────────────────────

  describe('complete', () => {
    it('throws NotFoundException when task not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.complete('ghost', 'token', null)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when lease is invalid', async () => {
      repo.findOneBy.mockResolvedValue(makeTask({ state: 'queued', leaseToken: 'x' }));
      await expect(service.complete('task-1', 'wrong', null)).rejects.toThrow(BadRequestException);
    });

    it('marks task as completed and clears lease', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'valid-token' });
      repo.findOneBy.mockResolvedValue(task);
      repo.save.mockImplementation(async (t: any) => t);

      const result = await service.complete('task-1', 'valid-token', { ok: true });
      expect(result.state).toBe('completed');
      expect(result.leaseToken).toBeNull();
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  // ─────────────────────────────────────────
  // fail
  // ─────────────────────────────────────────

  describe('fail', () => {
    it('throws NotFoundException when task not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.fail('ghost', 'token', 'err')).rejects.toThrow(NotFoundException);
    });

    it('re-queues the task when attempts < 3', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'tk', attempts: 2 });
      repo.findOneBy.mockResolvedValue(task);
      repo.save.mockImplementation(async (t: any) => t);

      const result = await service.fail('task-1', 'tk', 'network error');
      expect(result.state).toBe('queued');
    });

    it('marks the task as failed after 3+ attempts', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'tk', attempts: 3 });
      repo.findOneBy.mockResolvedValue(task);
      repo.save.mockImplementation(async (t: any) => t);

      const result = await service.fail('task-1', 'tk', 'crash');
      expect(result.state).toBe('failed');
    });

    it('stores the error message (truncated to 2000 chars)', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'tk', attempts: 1 });
      repo.findOneBy.mockResolvedValue(task);
      repo.save.mockImplementation(async (t: any) => t);

      const longErr = 'x'.repeat(3000);
      const result = await service.fail('task-1', 'tk', longErr);
      expect(result.lastError!.length).toBe(2000);
    });
  });

  // ─────────────────────────────────────────
  // cancel
  // ─────────────────────────────────────────

  describe('cancel', () => {
    it('throws NotFoundException when task not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.cancel('ghost')).rejects.toThrow(NotFoundException);
    });

    it('cancels a queued task', async () => {
      const task = makeTask({ state: 'queued' });
      repo.findOneBy.mockResolvedValue(task);
      repo.save.mockImplementation(async (t: any) => t);

      const result = await service.cancel('task-1');
      expect(result.state).toBe('cancelled');
    });

    it('returns already-completed task without changes', async () => {
      const task = makeTask({ state: 'completed' });
      repo.findOneBy.mockResolvedValue(task);

      const result = await service.cancel('task-1');
      expect(result.state).toBe('completed');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // releaseExpiredLeases
  // ─────────────────────────────────────────

  describe('releaseExpiredLeases', () => {
    it('returns 0 when no expired leases exist', async () => {
      repo.find.mockResolvedValue([]);
      const count = await service.releaseExpiredLeases();
      expect(count).toBe(0);
    });

    it('re-queues tasks with < 3 attempts', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'old', attempts: 1 });
      repo.find.mockResolvedValue([task]);
      repo.save.mockImplementation(async (t: any) => t);

      await service.releaseExpiredLeases();

      expect(task.state).toBe('queued');
      expect(task.leaseToken).toBeNull();
      expect(task.lastError).toBe('lease expired');
    });

    it('marks tasks as expired after 3+ attempts', async () => {
      const task = makeTask({ state: 'leased', leaseToken: 'old', attempts: 3 });
      repo.find.mockResolvedValue([task]);
      repo.save.mockImplementation(async (t: any) => t);

      await service.releaseExpiredLeases();

      expect(task.state).toBe('expired');
    });

    it('returns the count of processed expired leases', async () => {
      repo.find.mockResolvedValue([makeTask(), makeTask({ id: 'task-2' })]);
      repo.save.mockImplementation(async (t: any) => t);

      const count = await service.releaseExpiredLeases();
      expect(count).toBe(2);
    });
  });
});
