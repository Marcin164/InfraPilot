import { Test, TestingModule } from '@nestjs/testing';
import { EscalationWorker } from './escalation.worker';
import { EscalationEngineService } from 'src/services/escalationEngine.service';

describe('EscalationWorker', () => {
  let worker: EscalationWorker;
  let engine: jest.Mocked<EscalationEngineService>;

  beforeEach(async () => {
    engine = {
      processDueEscalations: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationWorker,
        { provide: EscalationEngineService, useValue: engine },
      ],
    }).compile();

    worker = module.get<EscalationWorker>(EscalationWorker);
  });

  it('delegates to EscalationEngineService.processDueEscalations on each tick', async () => {
    await worker.handle();
    expect(engine.processDueEscalations).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from the engine (does not swallow)', async () => {
    engine.processDueEscalations.mockRejectedValue(new Error('DB locked'));
    await expect(worker.handle()).rejects.toThrow('DB locked');
  });
});
