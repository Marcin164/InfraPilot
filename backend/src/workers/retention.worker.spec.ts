import { Test, TestingModule } from '@nestjs/testing';
import { RetentionWorker } from './retention.worker';
import { RetentionService } from 'src/services/retention.service';

describe('RetentionWorker', () => {
  let worker: RetentionWorker;
  let retentionService: jest.Mocked<RetentionService>;

  beforeEach(async () => {
    retentionService = {
      runAll: jest.fn().mockResolvedValue({ runs: [] }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionWorker,
        { provide: RetentionService, useValue: retentionService },
      ],
    }).compile();

    worker = module.get<RetentionWorker>(RetentionWorker);
  });

  it('calls retentionService.runAll on each tick', async () => {
    await worker.handle();
    expect(retentionService.runAll).toHaveBeenCalledTimes(1);
  });

  it('completes without error when no policies ran', async () => {
    retentionService.runAll.mockResolvedValue({ runs: [] });
    await expect(worker.handle()).resolves.not.toThrow();
  });

  it('completes without error when policies ran', async () => {
    retentionService.runAll.mockResolvedValue({
      runs: [
        { policyId: 'p-1', affected: 50 },
        { policyId: 'p-2', affected: 12 },
      ],
    });
    await expect(worker.handle()).resolves.not.toThrow();
  });
});
