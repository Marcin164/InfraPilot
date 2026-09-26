import { Test, TestingModule } from '@nestjs/testing';
import { AgentStaleWorker } from './agentStale.worker';
import { FleetService } from 'src/services/fleet.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { Devices } from 'src/entities/devices.entity';

const makeDevice = (overrides: Partial<Devices> = {}): Devices =>
  ({
    id: 'dev-1',
    assetName: 'WKS-001',
    model: 'OptiPlex 7080',
    lastScanAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    ...overrides,
  } as Devices);

describe('AgentStaleWorker', () => {
  let worker: AgentStaleWorker;
  let fleet: jest.Mocked<any>;
  let dispatcher: jest.Mocked<any>;

  beforeEach(async () => {
    fleet = { staleAgents: jest.fn().mockResolvedValue([]) };
    dispatcher = { dispatchOpsAlert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentStaleWorker,
        { provide: FleetService, useValue: fleet },
        { provide: NotificationDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    worker = module.get<AgentStaleWorker>(AgentStaleWorker);
  });

  it('does nothing when there are no stale agents', async () => {
    await worker.handle();
    expect(dispatcher.dispatchOpsAlert).not.toHaveBeenCalled();
  });

  it('dispatches an ops alert for each stale device, named by assetName', async () => {
    fleet.staleAgents.mockResolvedValue([makeDevice({ assetName: 'WKS-001' })]);

    await worker.handle();

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'agent_stale',
        title: expect.stringContaining('WKS-001'),
      }),
    );
  });

  it('falls back to model, then id, when assetName is missing', async () => {
    fleet.staleAgents.mockResolvedValue([makeDevice({ assetName: '', model: 'OptiPlex 7080' })]);

    await worker.handle();

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('OptiPlex 7080') }),
    );
  });

  it('notes a device that has never reported a scan at all', async () => {
    fleet.staleAgents.mockResolvedValue([makeDevice({ lastScanAt: null })]);

    await worker.handle();

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining('never sent a scan') }),
    );
  });

  it('re-alerts every run with no dedup, same as license_expiring', async () => {
    fleet.staleAgents.mockResolvedValue([makeDevice()]);

    await worker.handle();
    await worker.handle();

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledTimes(2);
  });

  it('processes multiple stale devices independently', async () => {
    fleet.staleAgents.mockResolvedValue([
      makeDevice({ id: 'dev-1', assetName: 'WKS-001' }),
      makeDevice({ id: 'dev-2', assetName: 'WKS-002' }),
    ]);

    await worker.handle();

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledTimes(2);
  });

  it('does not throw when fleet.staleAgents itself fails', async () => {
    fleet.staleAgents.mockRejectedValue(new Error('db down'));

    await expect(worker.handle()).resolves.not.toThrow();
  });

  it('does not throw when a dispatch fails', async () => {
    fleet.staleAgents.mockResolvedValue([makeDevice()]);
    dispatcher.dispatchOpsAlert.mockRejectedValue(new Error('smtp down'));

    await expect(worker.handle()).resolves.not.toThrow();
  });
});
