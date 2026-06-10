import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaPauseService } from './slaPause.service';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { SlaPause } from 'src/entities/slaPause.entity';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { BusinessTimeService } from './businessTime.service';
import { AuditService } from './audit.service';
import { Tickets, TicketState } from 'src/entities/tickets.entity';

const calendar = { timezone: 'UTC', workStart: '09:00', workEnd: '17:00', workingDays: '0111110', holidays: [] } as any;

const makeSlaInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-1',
    ticketId: 'ticket-1',
    breached: false,
    paused: false,
    dueAt: new Date('2024-01-08T14:00:00Z'),
    slaDefinition: { calendar },
    ...overrides,
  } as SlaInstance);

const makeTicket = (state: TicketState): Tickets =>
  ({ id: 'ticket-1', state } as Tickets);

const makePause = (overrides: Partial<SlaPause> = {}): SlaPause =>
  ({
    id: 'pause-1',
    slaInstance: { id: 'sla-1' },
    pausedAt: new Date('2024-01-08T11:00:00Z'),
    resumedAt: null,
    ...overrides,
  } as SlaPause);

describe('SlaPauseService', () => {
  let service: SlaPauseService;
  let instanceRepo: jest.Mocked<any>;
  let pauseRepo: jest.Mocked<any>;
  let escalationInstRepo: jest.Mocked<any>;
  let businessTime: jest.Mocked<BusinessTimeService>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    instanceRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (inst: any) => inst),
      findOne: jest.fn().mockResolvedValue(null),
    };

    pauseRepo = {
      save: jest.fn(async (p: any) => p),
      findOne: jest.fn().mockResolvedValue(null),
    };

    escalationInstRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (e: any) => e),
    };

    businessTime = {
      addPauseTime: jest.fn().mockResolvedValue(new Date('2024-01-08T15:00:00Z')),
      calculateBusinessMinutesBetween: jest.fn().mockResolvedValue(60),
      calculateDueDate: jest.fn().mockResolvedValue(new Date('2024-01-08T16:00:00Z')),
      isBusinessTime: jest.fn().mockResolvedValue(true),
    } as any;

    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaPauseService,
        { provide: getRepositoryToken(SlaInstance), useValue: instanceRepo },
        { provide: getRepositoryToken(SlaPause), useValue: pauseRepo },
        { provide: getRepositoryToken(SlaEscalationInstance), useValue: escalationInstRepo },
        { provide: BusinessTimeService, useValue: businessTime },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<SlaPauseService>(SlaPauseService);
  });

  // ─────────────────────────────────────────
  // handleStateChange — PAUSE
  // ─────────────────────────────────────────

  describe('handleStateChange — entering pause state', () => {
    it('pauses non-paused instances when moving to AWAITING_USER', async () => {
      const inst = makeSlaInstance({ paused: false });
      instanceRepo.find.mockResolvedValue([inst]);

      await service.handleStateChange(
        makeTicket(TicketState.AWAITING_USER),
        TicketState.OPEN,
      );

      expect(instanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paused: true }),
      );
      expect(pauseRepo.save).toHaveBeenCalled();
    });

    it('pauses instances when moving to AWAITING_VENDOR', async () => {
      const inst = makeSlaInstance({ paused: false });
      instanceRepo.find.mockResolvedValue([inst]);

      await service.handleStateChange(
        makeTicket(TicketState.AWAITING_VENDOR),
        TicketState.IN_PROGRESS,
      );

      expect(instanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paused: true }),
      );
    });

    it('skips instances that are already paused', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);

      await service.handleStateChange(
        makeTicket(TicketState.AWAITING_USER),
        TicketState.OPEN,
      );

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });

    it('logs audit SLA_PAUSED for each paused instance', async () => {
      instanceRepo.find.mockResolvedValue([makeSlaInstance()]);

      await service.handleStateChange(
        makeTicket(TicketState.AWAITING_USER),
        TicketState.OPEN,
      );

      expect(audit.log).toHaveBeenCalledWith(
        'SLA_INSTANCE',
        'sla-1',
        'SLA_PAUSED',
        expect.any(Object),
        undefined,
      );
    });

    it('does not pause when staying in a pause state (wasPaused && shouldPause)', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);

      await service.handleStateChange(
        makeTicket(TicketState.AWAITING_USER),
        TicketState.AWAITING_VENDOR,
      );

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // handleStateChange — RESUME
  // ─────────────────────────────────────────

  describe('handleStateChange — leaving pause state', () => {
    it('resumes paused instances and extends dueAt by pause duration', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);

      const pause = makePause();
      pauseRepo.findOne.mockResolvedValue(pause);

      const extendedDue = new Date('2024-01-08T15:00:00Z');
      businessTime.addPauseTime.mockResolvedValue(extendedDue);

      await service.handleStateChange(
        makeTicket(TicketState.IN_PROGRESS),
        TicketState.AWAITING_USER,
      );

      expect(instanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paused: false, dueAt: extendedDue }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        'SLA_INSTANCE',
        'sla-1',
        'SLA_RESUMED',
        expect.any(Object),
        undefined,
      );
    });

    it('skips instances that are not paused on resume', async () => {
      const inst = makeSlaInstance({ paused: false });
      instanceRepo.find.mockResolvedValue([inst]);

      await service.handleStateChange(
        makeTicket(TicketState.IN_PROGRESS),
        TicketState.AWAITING_USER,
      );

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });

    it('skips resume when no open pause record is found', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);
      pauseRepo.findOne.mockResolvedValue(null);

      await service.handleStateChange(
        makeTicket(TicketState.IN_PROGRESS),
        TicketState.AWAITING_USER,
      );

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });

    it('recalculates pending escalation trigger times on resume', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);
      pauseRepo.findOne.mockResolvedValue(makePause());

      const pendingEsc = { id: 'esc-1', triggerAt: new Date(), triggered: false };
      escalationInstRepo.find.mockResolvedValue([pendingEsc]);

      await service.handleStateChange(
        makeTicket(TicketState.IN_PROGRESS),
        TicketState.AWAITING_USER,
      );

      expect(escalationInstRepo.save).toHaveBeenCalled();
      expect(businessTime.calculateBusinessMinutesBetween).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // handleManualPause
  // ─────────────────────────────────────────

  describe('handleManualPause', () => {
    it('pauses all non-paused instances for the given ticket', async () => {
      instanceRepo.find.mockResolvedValue([makeSlaInstance({ paused: false })]);

      await service.handleManualPause('ticket-1');

      expect(instanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paused: true }),
      );
      expect(pauseRepo.save).toHaveBeenCalled();
    });

    it('skips already-paused instances', async () => {
      instanceRepo.find.mockResolvedValue([makeSlaInstance({ paused: true })]);

      await service.handleManualPause('ticket-1');

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });

    it('uses provided manager repo instead of injected repo', async () => {
      const managerInstanceRepo = {
        find: jest.fn().mockResolvedValue([makeSlaInstance()]),
        save: jest.fn(async (i: any) => i),
      };
      const managerPauseRepo = {
        save: jest.fn(async (p: any) => p),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation((entity: any) => {
          if (entity === SlaInstance) return managerInstanceRepo;
          return managerPauseRepo;
        }),
      };

      await service.handleManualPause('ticket-1', manager as any);

      expect(instanceRepo.find).not.toHaveBeenCalled();
      expect(managerInstanceRepo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // handleManualResume
  // ─────────────────────────────────────────

  describe('handleManualResume', () => {
    it('resumes paused instances and extends dueAt', async () => {
      const inst = makeSlaInstance({ paused: true });
      instanceRepo.find.mockResolvedValue([inst]);
      pauseRepo.findOne.mockResolvedValue(makePause());

      await service.handleManualResume('ticket-1');

      expect(instanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paused: false }),
      );
    });

    it('does nothing when no instances are paused', async () => {
      instanceRepo.find.mockResolvedValue([makeSlaInstance({ paused: false })]);

      await service.handleManualResume('ticket-1');

      expect(instanceRepo.save).not.toHaveBeenCalled();
    });
  });
});
