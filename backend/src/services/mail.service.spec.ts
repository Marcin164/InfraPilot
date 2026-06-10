import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { SmtpSettingsService } from './smtp-settings.service';

const makeSendMail = () => jest.fn().mockResolvedValue({});

const makeModule = async (smtpConfig: any | null) => {
  const sendMail = makeSendMail();
  const mockTransporter = { sendMail };

  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => mockTransporter),
  }));

  const smtpSettings: Partial<SmtpSettingsService> = {
    getConfig: jest.fn().mockResolvedValue(smtpConfig),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MailService,
      { provide: SmtpSettingsService, useValue: smtpSettings },
    ],
  }).compile();

  const service = module.get<MailService>(MailService);
  await service.onModuleInit();
  return { service, sendMail, smtpSettings };
};

describe('MailService', () => {
  afterEach(() => jest.resetModules());

  describe('send', () => {
    it('returns immediately when recipient is empty', async () => {
      const { service } = await makeModule(null);
      await expect(
        service.send({ to: '', subject: 'S', body: 'B' }),
      ).resolves.not.toThrow();
    });

    it('logs and returns (stub mode) when SMTP not configured', async () => {
      const { service } = await makeModule(null);
      expect(service.isConfigured).toBe(false);
      await expect(
        service.send({ to: 'jan@acme.com', subject: 'Hello', body: 'World' }),
      ).resolves.not.toThrow();
    });

    it('is configured when getConfig returns a valid host', async () => {
      const { service } = await makeModule({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'u',
        pass: 'p',
        from: 'from@example.com',
      });
      expect(service.isConfigured).toBe(true);
    });
  });

  describe('sendMany', () => {
    it('resolves for an empty list', async () => {
      const { service } = await makeModule(null);
      await expect(service.sendMany([])).resolves.not.toThrow();
    });
  });

  describe('reinit', () => {
    it('switches from stub to configured after reinit with new config', async () => {
      const smtpSettings = {
        getConfig: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          user: 'u',
          pass: 'p',
          from: 'noreply@example.com',
        }),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: SmtpSettingsService, useValue: smtpSettings },
        ],
      }).compile();
      const service = module.get<MailService>(MailService);
      await service.onModuleInit();
      expect(service.isConfigured).toBe(false);
      await service.reinit();
      expect(service.isConfigured).toBe(true);
    });
  });
});
