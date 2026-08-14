import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tickets } from 'src/entities/tickets.entity';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { SlaEngineService } from './slaEngine.service';

enum EscalationActionType {
  NOTIFY = 'NOTIFY',
  REASSIGN = 'REASSIGN',
  PRIORITY_UP = 'PRIORITY_UP',
}

@Injectable()
export class EscalationActionService {
  constructor(
    @InjectRepository(Tickets)
    private ticketsRepo: Repository<Tickets>,

    @Inject(forwardRef(() => SlaEngineService))
    private readonly slaEngine: SlaEngineService,
  ) {}

  async execute(escalation: SlaEscalationInstance, manager?: EntityManager) {
    const actionType = escalation.definition.actionType;
    const config = escalation.definition.actionConfig;

    const ticketId = escalation.slaInstance.ticketId;

    switch (actionType) {
      case EscalationActionType.NOTIFY:
        await this.notify(ticketId, config);
        break;

      case EscalationActionType.REASSIGN:
        await this.reassign(ticketId, config, manager);
        break;

      case EscalationActionType.PRIORITY_UP:
        await this.increasePriority(ticketId, config, manager);
        break;
    }
  }

  private async notify(_ticketId: string, _config: any) {
    // tu możesz podpiąć mail / websocket
  }

  private async reassign(
    ticketId: string,
    config: any,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Tickets) : this.ticketsRepo;
    await repo.update(ticketId, {
      assignmentGroup: config?.group,
    });
  }

  private async increasePriority(
    ticketId: string,
    config: any,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Tickets) : this.ticketsRepo;
    const ticket = await repo.findOneBy({ id: ticketId });
    if (!ticket) return;

    const previousPriority = ticket.priority;
    ticket.priority = config?.to;
    await repo.save(ticket);

    if (ticket.priority !== previousPriority) {
      // Must reuse the *same* connection/transaction as the caller:
      // this action can run inside EscalationEngineService's queryRunner,
      // which already holds a `pessimistic_write` lock on this ticket's
      // SlaInstance row. handlePriorityChange() rewrites that same row —
      // calling it on a separate connection would try to lock a row the
      // outer transaction is still holding, deadlocking against itself
      // (previously hung ticket updates app-wide for 30+ min this way,
      // since it also holds the audit log's global advisory lock).
      await this.slaEngine.handlePriorityChange(ticket, manager);
    }
  }
}
