import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketCategory } from 'src/entities/ticketCategory.entity';
import {
  TicketWorkflow,
  WorkflowStep,
  WorkflowTrigger,
} from 'src/entities/ticketWorkflow.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { TicketsApprovals } from 'src/entities/ticketsApprovals.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { AuditService } from './audit.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { uuidv4 } from 'src/helpers/uuidv4';

@Injectable()
export class TicketWorkflowService {
  private readonly logger = new Logger(TicketWorkflowService.name);

  constructor(
    @InjectRepository(TicketWorkflow)
    private readonly workflows: Repository<TicketWorkflow>,
    @InjectRepository(TicketCategory)
    private readonly categories: Repository<TicketCategory>,
    @InjectRepository(Tickets)
    private readonly tickets: Repository<Tickets>,
    @InjectRepository(TicketsApprovals)
    private readonly approvals: Repository<TicketsApprovals>,
    @InjectRepository(TicketsComments)
    private readonly comments: Repository<TicketsComments>,
    private readonly audit: AuditService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  // ---------------- Categories ----------------

  listCategories() {
    return this.categories.find({ order: { name: 'ASC' as any } });
  }

  async upsertCategory(input: Partial<TicketCategory> & { name: string }) {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }
    const existing = input.id
      ? await this.categories.findOneBy({ id: input.id })
      : await this.categories.findOneBy({ name: input.name });

    if (existing) {
      Object.assign(existing, input);
      return this.categories.save(existing);
    }
    const row = this.categories.create({
      id: uuidv4(),
      enabled: true,
      color: input.color ?? '#2B9AE9',
      ...input,
    } as TicketCategory);
    return this.categories.save(row);
  }

  async deleteCategory(id: string) {
    await this.categories.delete({ id });
  }

  async findCategoryByName(name: string) {
    return this.categories.findOneBy({ name });
  }

  async seedDefaultCategories(): Promise<number> {
    const defaults: {
      name: string;
      ticketType: 'Incident' | 'Service' | null;
      color: string;
    }[] = [
      { name: 'Hardware issue',        ticketType: 'Incident', color: '#FF6B35' },
      { name: 'Software issue',        ticketType: 'Incident', color: '#2B9AE9' },
      { name: 'Network issue',         ticketType: 'Incident', color: '#30A712' },
      { name: 'Account / Access',      ticketType: 'Incident', color: '#9B59B6' },
      { name: 'Security incident',     ticketType: 'Incident', color: '#F3606E' },
      { name: 'New equipment',         ticketType: 'Service',  color: '#1ABC9C' },
      { name: 'Software installation', ticketType: 'Service',  color: '#3498DB' },
      { name: 'Account request',       ticketType: 'Service',  color: '#8E44AD' },
      { name: 'Access request',        ticketType: 'Service',  color: '#E67E22' },
      { name: 'General question',      ticketType: 'Service',  color: '#2ECC71' },
      { name: 'Other',                 ticketType: null,       color: '#9a9a9a' },
    ];

    let inserted = 0;
    for (const d of defaults) {
      const exists = await this.categories.findOneBy({ name: d.name });
      if (exists) continue;
      const row = this.categories.create({
        id: uuidv4(),
        name: d.name,
        ticketType: d.ticketType as any,
        color: d.color,
        enabled: true,
        workflowId: null,
      } as any);
      await this.categories.save(row);
      inserted++;
    }

    return inserted;
  }

  // ---------------- Workflows ----------------

  listWorkflows() {
    return this.workflows.find({ order: { name: 'ASC' as any } });
  }

  async getWorkflow(id: string) {
    const w = await this.workflows.findOneBy({ id });
    if (!w) throw new NotFoundException('Workflow not found');
    return w;
  }

  async upsertWorkflow(
    input: Partial<TicketWorkflow> & { name: string; steps: WorkflowStep[] },
    actorId: string,
  ) {
    const cleanedSteps = (input.steps ?? []).map((s, i) => ({
      id: s.id ?? uuidv4(),
      order: typeof s.order === 'number' ? s.order : i,
      type: s.type,
      label: s.label,
      config: s.config ?? {},
    }));
    cleanedSteps.sort((a, b) => a.order - b.order);

    const existing: any = input.id
      ? await this.workflows.findOneBy({ id: input.id })
      : null;

    if (existing) {
      existing.name = input.name;
      existing.description = input.description;
      if (input.trigger) existing.trigger = input.trigger;
      if (typeof input.enabled === 'boolean') existing.enabled = input.enabled;
      existing.steps = cleanedSteps;
      return this.workflows.save(existing);
    }

    const row: any = this.workflows.create({
      id: uuidv4(),
      name: input.name,
      description: input.description,
      trigger: input.trigger ?? 'on_create',
      enabled: input.enabled ?? true,
      steps: cleanedSteps,
      createdBy: actorId,
    });
    return this.workflows.save(row);
  }

  async deleteWorkflow(id: string) {
    // Detach categories first.
    await this.categories.update({ workflowId: id }, { workflowId: null });
    await this.workflows.delete({ id });
  }

  // ---------------- Engine ----------------

  /** Convenience wrapper kept for backward compat / readability at call site. */
  async runOnCreate(ticket: Tickets): Promise<void> {
    return this.runForTicket(ticket, 'on_create');
  }

  /**
   * Run all enabled workflows whose trigger matches for the ticket's category.
   * Best-effort: logs & continues on step failures so one broken step doesn't
   * sink the whole sequence.
   */
  async runForTicket(ticket: Tickets, trigger: WorkflowTrigger): Promise<void> {
    if (!ticket.category) return;
    const category = await this.categories.findOneBy({
      name: ticket.category,
    });
    if (!category?.workflowId) return;

    const workflow = await this.workflows.findOneBy({
      id: category.workflowId,
    });
    if (!workflow || !workflow.enabled || workflow.trigger !== trigger) {
      return;
    }

    await this.audit.log('TicketWorkflow', workflow.id, 'started', {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      trigger,
    });

    const ordered = [...(workflow.steps ?? [])].sort(
      (a, b) => a.order - b.order,
    );
    for (const step of ordered) {
      try {
        await this.runStep(ticket, step);
        await this.audit.log('TicketWorkflow', workflow.id, 'step_ok', {
          ticketId: ticket.id,
          stepId: step.id,
          stepType: step.type,
        });
      } catch (err) {
        this.logger.warn(
          `Workflow ${workflow.id} step ${step.id} (${step.type}) failed for ticket ${ticket.id}: ${(err as Error).message}`,
        );
        await this.audit.log('TicketWorkflow', workflow.id, 'step_failed', {
          ticketId: ticket.id,
          stepId: step.id,
          stepType: step.type,
          error: (err as Error).message,
        });
      }
    }

    await this.audit.log('TicketWorkflow', workflow.id, 'finished', {
      ticketId: ticket.id,
    });
  }

  private async runStep(ticket: Tickets, step: WorkflowStep): Promise<void> {
    const cfg = step.config ?? {};
    const url = `/admin/helpdesk/${ticket.id}`;

    switch (step.type) {
      case 'request_approval': {
        const approverIds: string[] = Array.isArray(cfg.approverIds)
          ? cfg.approverIds.filter((s: any) => typeof s === 'string')
          : [];
        if (approverIds.length === 0) return;

        for (const approverId of approverIds) {
          const approval = this.approvals.create({
            id: uuidv4(),
            ticketId: ticket.id,
            requesterId: ticket.requesterId,
            approverId,
            decision: 'pending',
          } as any);
          await this.approvals.save(approval);
        }

        await this.dispatcher.dispatch({
          recipientIds: approverIds,
          event: 'ticket_assigned',
          title: `Approval requested on ticket #${ticket.number}`,
          body:
            cfg.message?.toString() ??
            `You've been asked to approve ticket #${ticket.number}.`,
          smsBody: `Approval needed on #${ticket.number}`,
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return;
      }

      case 'notify': {
        const recipientIds: string[] = this.resolveRecipients(ticket, cfg);
        if (recipientIds.length === 0) return;
        await this.dispatcher.dispatch({
          recipientIds,
          event: cfg.event ?? 'ticket_state_changed',
          title: cfg.title ?? `Ticket #${ticket.number} update`,
          body: cfg.body ?? '',
          smsBody: cfg.smsBody ?? null,
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return;
      }

      case 'set_field': {
        const allowed = ['priority', 'urgency', 'impact', 'assignmentGroup'];
        if (!allowed.includes(cfg.field)) {
          throw new Error(`field '${cfg.field}' not allowed`);
        }
        await this.tickets.update(
          { id: ticket.id },
          { [cfg.field]: cfg.value },
        );
        // Reflect into the in-memory ticket too so later steps see the new value.
        (ticket as any)[cfg.field] = cfg.value;
        return;
      }

      case 'assign_to': {
        if (typeof cfg.userId !== 'string') {
          throw new Error('assign_to requires config.userId');
        }
        await this.tickets.update({ id: ticket.id }, { assignee: cfg.userId });
        ticket.assignee = cfg.userId;
        await this.dispatcher.dispatch({
          recipientIds: [cfg.userId],
          event: 'ticket_assigned',
          title: `Ticket #${ticket.number} assigned to you`,
          body: ticket.description?.slice(0, 400) ?? '',
          smsBody: `Ticket #${ticket.number} assigned to you`,
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return;
      }

      case 'create_comment': {
        if (!cfg.content) return;
        const comment = this.comments.create({
          id: uuidv4(),
          ticketId: ticket.id,
          authorId: cfg.authorId ?? null,
          content: String(cfg.content),
          type: cfg.type === 'Worknotes' ? 'Worknotes' : 'Public',
        } as any);
        await this.comments.save(comment);
        return;
      }

      default:
        throw new Error(`unknown step type: ${step.type}`);
    }
  }

  private resolveRecipients(ticket: Tickets, cfg: any): string[] {
    const out = new Set<string>();
    const kind = cfg.recipientType ?? 'specific';
    if (kind === 'requester' && ticket.requesterId) out.add(ticket.requesterId);
    if (kind === 'assignee' && ticket.assignee) out.add(ticket.assignee);
    if (kind === 'specific' && Array.isArray(cfg.recipientIds)) {
      for (const id of cfg.recipientIds) {
        if (typeof id === 'string') out.add(id);
      }
    }
    return Array.from(out);
  }
}
