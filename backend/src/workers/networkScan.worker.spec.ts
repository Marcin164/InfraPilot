import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NetworkScanWorker } from './networkScan.worker';
import { AgentTaskService } from 'src/services/agentTask.service';
import { IpamService } from 'src/services/ipam.service';
import { AgentTask } from 'src/entities/agentTask.entity';

const makeSubnet = (overrides: Record<string, any> = {}) => ({
  id: 'subnet-1',
  cidr: '192.168.1.0/24',
  locationId: 'loc-1',
  ...overrides,
});

describe('NetworkScanWorker', () => {
  let worker: NetworkScanWorker;
  let agentTasks: jest.Mocked<any>;
  let ipamService: jest.Mocked<any>;
  let taskRepo: jest.Mocked<any>;
  let qb: jest.Mocked<any>;

  beforeEach(async () => {
    agentTasks = { enqueue: jest.fn().mockResolvedValue({}) };
    ipamService = {
      findAllSubnets: jest.fn().mockResolvedValue([]),
      findScanCandidates: jest.fn().mockResolvedValue([]),
    };
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    taskRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkScanWorker,
        { provide: AgentTaskService, useValue: agentTasks },
        { provide: IpamService, useValue: ipamService },
        { provide: getRepositoryToken(AgentTask), useValue: taskRepo },
      ],
    }).compile();

    worker = module.get<NetworkScanWorker>(NetworkScanWorker);
    delete process.env.NETWORK_SCAN_INTERVAL_HOURS;
  });

  it('skips subnets with no locationId', async () => {
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet({ locationId: null })]);

    const created = await worker.runOnce();

    expect(created).toBe(0);
    expect(agentTasks.enqueue).not.toHaveBeenCalled();
  });

  it('skips a subnet with no Windows agent at its location', async () => {
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet()]);
    ipamService.findScanCandidates.mockResolvedValue([]);

    const created = await worker.runOnce();

    expect(created).toBe(0);
    expect(agentTasks.enqueue).not.toHaveBeenCalled();
  });

  it('queues a network_scan task against the first candidate device', async () => {
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet()]);
    ipamService.findScanCandidates.mockResolvedValue([{ id: 'device-1' }, { id: 'device-2' }]);

    const created = await worker.runOnce();

    expect(created).toBe(1);
    expect(agentTasks.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'device-1',
        type: 'network_scan',
        payload: { cidr: '192.168.1.0/24', subnetId: 'subnet-1', auto: true },
      }),
    );
  });

  it('skips a subnet that already has a queued or leased scan task', async () => {
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet()]);
    ipamService.findScanCandidates.mockResolvedValue([{ id: 'device-1' }]);
    qb.getOne.mockResolvedValue({ state: 'queued', createdAt: new Date() } as AgentTask);

    const created = await worker.runOnce();

    expect(created).toBe(0);
    expect(agentTasks.enqueue).not.toHaveBeenCalled();
  });

  it('skips a subnet scanned more recently than the configured interval', async () => {
    process.env.NETWORK_SCAN_INTERVAL_HOURS = '12';
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet()]);
    ipamService.findScanCandidates.mockResolvedValue([{ id: 'device-1' }]);
    qb.getOne.mockResolvedValue({
      state: 'completed',
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    } as AgentTask);

    const created = await worker.runOnce();

    expect(created).toBe(0);
    expect(agentTasks.enqueue).not.toHaveBeenCalled();
  });

  it('re-scans a subnet whose last scan is older than the configured interval', async () => {
    process.env.NETWORK_SCAN_INTERVAL_HOURS = '12';
    ipamService.findAllSubnets.mockResolvedValue([makeSubnet()]);
    ipamService.findScanCandidates.mockResolvedValue([{ id: 'device-1' }]);
    qb.getOne.mockResolvedValue({
      state: 'completed',
      createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13h ago
    } as AgentTask);

    const created = await worker.runOnce();

    expect(created).toBe(1);
    expect(agentTasks.enqueue).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the sweep fails -- swallows and logs', async () => {
    ipamService.findAllSubnets.mockRejectedValue(new Error('db down'));
    await expect(worker.sweepSubnets()).resolves.not.toThrow();
  });
});
