import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('SmsService', () => {
  let service: SmsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsService],
    }).compile();
    service = module.get<SmsService>(SmsService);
    // reset relay url
    (service as any).relayUrl = null;
    (service as any).relayToken = null;
  });

  describe('send', () => {
    it('returns immediately when recipient is empty', async () => {
      await expect(service.send({ to: '', body: 'msg' })).resolves.not.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('logs and returns without fetching when no relay URL is configured', async () => {
      await service.send({ to: '+48123456789', body: 'Hello' });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('truncates body to 480 characters', async () => {
      (service as any).relayUrl = 'https://sms.example.com/send';
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const longBody = 'x'.repeat(600);
      await service.send({ to: '+48123456789', body: longBody });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.body.length).toBe(480);
    });

    it('POSTs to relay URL when configured', async () => {
      (service as any).relayUrl = 'https://sms.example.com/send';
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      await service.send({ to: '+48123456789', body: 'Hello' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sms.example.com/send',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes Authorization header when relay token is set', async () => {
      (service as any).relayUrl = 'https://sms.example.com/send';
      (service as any).relayToken = 'sms-token';
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      await service.send({ to: '+48123456789', body: 'Hi' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Authorization']).toBe('Bearer sms-token');
    });

    it('does not throw when relay returns non-ok status', async () => {
      (service as any).relayUrl = 'https://sms.example.com/send';
      mockFetch.mockResolvedValue({ ok: false, status: 503 });

      await expect(service.send({ to: '+48123456789', body: 'Hi' })).resolves.not.toThrow();
    });

    it('does not throw when fetch throws', async () => {
      (service as any).relayUrl = 'https://sms.example.com/send';
      mockFetch.mockRejectedValue(new Error('timeout'));

      await expect(service.send({ to: '+48123456789', body: 'Hi' })).resolves.not.toThrow();
    });
  });
});
