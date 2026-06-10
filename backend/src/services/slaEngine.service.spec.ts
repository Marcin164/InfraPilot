import { Test, TestingModule } from '@nestjs/testing';
import { SlaEngineService } from './slaEngine.service';
import { SlaCreatorService } from './slaCreator.service';
import { SlaPauseService } from './slaPause.service';
import { SlaBreachService } from './slaBreach.service';
import { Tickets, TicketState, TicketPriority, TicketType } from 'src/entities/tickets.entity';

const mockTicket = (): Tickets =>
  ({
    id: 'ticket-uuid',
    number: 1001,
    type: TicketType.INCIDENT,
    state: TicketState.NEW,
    priority: TicketPriority.MEDIUM,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tickets);

describe('SlaEngineService', () => {
  let service: SlaEngineService;
  let creator: jest.Mocked<SlaCreatorService>;
  let pauseService: jest.Mocked<SlaPauseService>;
  let breachService: jest.Mocked<SlaBreachService>;

  beforeEach(async () => {
    creator = {
      createInstances: jest.fn().mockResolvedValue(undefined),
      deleteInstancesForTicket: jest.fn().mockResolvedValue(undefined),
    } as any;

    pauseService = {
      handleStateChange: jest.fn().mockResolvedValue(undefined),
    } as any;

    breachService = {
      finishSla: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaEngineService,
        { provide: SlaCreatorService, useValue: creator },
        { provide: SlaPauseService, useValue: pauseService },
        { provide: SlaBreachService, useValue: breachService },
      ],
    }).compile();

    service = module.get<SlaEngineService>(SlaEngineService);
  });

  describe('createForTicket', () => {
    it('delegates to SlaCreatorService.createInstances', async () => {
      const ticket = mockTicket();

      await service.createForTicket(ticket);

      expect(creator.createInstances).toHaveBeenCalledWith(ticket, undefined);
    });

    it('passes manager through to creator', async () => {
      const ticket = mockTicket();
      const manager = {} as any;

      await service.createForTicket(ticket, manager);

      expect(creator.createInstances).toHaveBeenCalledWith(ticket, manager);
    });
  });

  describe('handleStateChange', () => {
    it('delegates to SlaPauseService.handleStateChange', async () => {
      const ticket = mockTicket();
      const prevState = TicketState.NEW;

      await service.handleStateChange(ticket, prevState);

      expect(pauseService.handleStateChange).toHaveBeenCalledWith(ticket, prevState, undefined);
    });

    it('passes manager through to pause service', async () => {
      const ticket = mockTicket();
      const manager = {} as any;

      await service.handleStateChange(ticket, TicketState.ASSIGNED, manager);

      expect(pauseService.handleStateChange).toHaveBeenCalledWith(ticket, TicketState.ASSIGNED, manager);
    });
  });

  describe('handleResolved', () => {
    it('calls SlaBreachService.finishSla with the ticket id', async () => {
      const ticket = mockTicket();

      await service.handleResolved(ticket);

      expect(breachService.finishSla).toHaveBeenCalledWith(ticket.id, undefined);
    });

    it('passes manager to finishSla', async () => {
      const ticket = mockTicket();
      const manager = {} as any;

      await service.handleResolved(ticket, manager);

      expect(breachService.finishSla).toHaveBeenCalledWith(ticket.id, manager);
    });
  });

  describe('handlePriorityChange', () => {
    it('deletes existing SLA instances then re-creates them', async () => {
      const ticket = mockTicket();
      const callOrder: string[] = [];
      creator.deleteInstancesForTicket.mockImplementation(async () => {
        callOrder.push('delete');
      });
      creator.createInstances.mockImplementation(async () => {
        callOrder.push('create');
      });

      await service.handlePriorityChange(ticket);

      expect(creator.deleteInstancesForTicket).toHaveBeenCalledWith(ticket.id, undefined);
      expect(creator.createInstances).toHaveBeenCalledWith(ticket, undefined);
      expect(callOrder).toEqual(['delete', 'create']);
    });

    it('passes manager to both delete and create', async () => {
      const ticket = mockTicket();
      const manager = {} as any;

      await service.handlePriorityChange(ticket, manager);

      expect(creator.deleteInstancesForTicket).toHaveBeenCalledWith(ticket.id, manager);
      expect(creator.createInstances).toHaveBeenCalledWith(ticket, manager);
    });
  });
});
