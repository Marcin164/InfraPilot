import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CveCriticalListener } from './cveCritical.listener';
import { Applications } from 'src/entities/applications.entity';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { CveCriticalDetectedEvent } from 'src/events/cve-critical-detected.event';

describe('CveCriticalListener', () => {
  let listener: CveCriticalListener;
  let applicationsRepo: jest.Mocked<any>;
  let dispatcher: jest.Mocked<any>;

  beforeEach(async () => {
    applicationsRepo = { findOneBy: jest.fn() };
    dispatcher = { dispatchOpsAlert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CveCriticalListener,
        { provide: getRepositoryToken(Applications), useValue: applicationsRepo },
        { provide: NotificationDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    listener = module.get<CveCriticalListener>(CveCriticalListener);
  });

  it('dispatches an ops alert naming the app and CVE id', async () => {
    applicationsRepo.findOneBy.mockResolvedValue({ id: 'app-1', name: 'OpenSSL' });

    await listener.handleCveCriticalDetected(
      new CveCriticalDetectedEvent('match-1', 'app-1', '3.0.1', 'CVE-2024-1234'),
    );

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'cve_critical',
        title: expect.stringContaining('CVE-2024-1234'),
        body: expect.stringContaining('OpenSSL 3.0.1'),
      }),
    );
  });

  it('falls back to the raw applicationId when the app record is gone', async () => {
    applicationsRepo.findOneBy.mockResolvedValue(null);

    await listener.handleCveCriticalDetected(
      new CveCriticalDetectedEvent('match-1', 'app-missing', null, 'CVE-2024-5678'),
    );

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining('app-missing') }),
    );
  });

  it('does not throw when the dispatch itself fails', async () => {
    applicationsRepo.findOneBy.mockResolvedValue(null);
    dispatcher.dispatchOpsAlert.mockRejectedValue(new Error('smtp down'));

    await expect(
      listener.handleCveCriticalDetected(
        new CveCriticalDetectedEvent('match-1', 'app-1', '1.0', 'CVE-2024-0001'),
      ),
    ).resolves.not.toThrow();
  });
});
