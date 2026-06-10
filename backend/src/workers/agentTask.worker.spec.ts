import { Test, TestingModule } from '@nestjs/testing';
import { AgentTaskWorker } from './agentTask.worker';
import { AgentTaskService } from 'src/services/agentTask.service';

describe('AgentTaskWorker', () => {
  let worker: AgentTaskWorker;
  let service: jest.Mocked<AgentTaskService>;

  beforeEach(async () => {
    service = {
      releaseExpiredLeases: jest.fn().mockResolvedValue(0),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentTaskWorker,
        { provide: AgentTaskService, useValue: service },
      ],
    }).compile();

    worker = module.get<AgentTaskWorker>(AgentTaskWorker);
  });

  it('calls releaseExpiredLeases on each sweep', async () => {
    await worker.sweepLeases();
    expect(service.releaseExpiredLeases).toHaveBeenCalledTimes(1);
  });

  it('does not throw when service returns 0 released', async () => {
    service.releaseExpiredLeases.mockResolvedValue(0);
    await expect(worker.sweepLeases()).resolves.not.toThrow();
  });

  it('does not throw when service throws — swallows and logs', async () => {
    service.releaseExpiredLeases.mockRejectedValue(new Error('timeout'));
    await expect(worker.sweepLeases()).resolves.not.toThrow();
  });
});
