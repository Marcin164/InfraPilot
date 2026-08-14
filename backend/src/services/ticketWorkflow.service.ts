import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';
import { TicketCategory } from 'src/entities/ticketCategory.entity';
import type { CustomFieldType } from 'src/entities/ticketCategory.entity';
import { TicketType } from 'src/entities/tickets.entity';
import { TicketWorkflow, WorkflowStep } from 'src/entities/ticketWorkflow.entity';
import type { WorkflowStepType, WorkflowTrigger } from 'src/entities/ticketWorkflow.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { TicketActivity } from 'src/entities/ticketActivity.entity';
import { TicketsApprovals } from 'src/entities/ticketsApprovals.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { Users } from 'src/entities/users.entity';
import { AuditService } from './audit.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { uuidv4 } from 'src/helpers/uuidv4';

const STEP_ATTACHMENT_DIR = path.resolve(process.cwd(), 'uploads', 'workflow-attachments');

// Kept in sync with TicketsService's ALLOWED_ATTACHMENT_MIME -- not imported
// from there to avoid a circular module dependency (TicketsService already
// depends on TicketWorkflowService for the workflow-on-update hook).
const ALLOWED_STEP_ATTACHMENT_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/webm',
  'audio/ogg',
]);

export class CustomFieldDto {
  @IsString() @IsNotEmpty()
  id: string;

  @IsString() @IsNotEmpty()
  label: string;

  @IsIn(['text', 'textarea', 'number', 'select', 'checkbox', 'date'])
  type: CustomFieldType;

  @IsBoolean()
  required: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  options?: string[];
}

export class UpsertCategoryDto {
  @IsOptional() @IsString()
  id?: string;

  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsIn(Object.values(TicketType))
  ticketType?: TicketType;

  @IsOptional() @IsString()
  description?: string | null;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  @IsOptional() @IsString()
  workflowId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields?: CustomFieldDto[];
}

export class WorkflowStepDto {
  @IsOptional() @IsString()
  id?: string;

  @IsOptional() @IsNumber()
  order?: number;

  @IsIn(['request_approval', 'notify', 'set_field', 'assign_to', 'create_comment', 'add_attachment'])
  type: WorkflowStepType;

  @IsOptional() @IsString()
  label?: string;

  @IsOptional()
  config?: Record<string, any>;
}

export class UpsertWorkflowDto {
  @IsOptional() @IsString()
  id?: string;

  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['on_create', 'on_state_change', 'on_assign', 'on_priority_change', 'on_close'])
  trigger?: WorkflowTrigger;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}

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
    @InjectRepository(TicketActivity)
    private readonly activities: Repository<TicketActivity>,
    @InjectRepository(TicketsApprovals)
    private readonly approvals: Repository<TicketsApprovals>,
    @InjectRepository(TicketsComments)
    private readonly comments: Repository<TicketsComments>,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly audit: AuditService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  // ---------------- Categories ----------------

  listCategories() {
    return this.categories.find({ order: { name: 'ASC' as any } });
  }

  async upsertCategory(input: UpsertCategoryDto) {
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

  async upsertWorkflow(input: UpsertWorkflowDto, actorId: string) {
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
    const paused = await this.runSteps(ticket, workflow, ordered);
    if (!paused) {
      await this.audit.log('TicketWorkflow', workflow.id, 'finished', {
        ticketId: ticket.id,
      });
    }
  }

  /**
   * Called from TicketsService.updateApproval once a *required*
   * `request_approval` step's approval has been decided. Rejecting stops the
   * workflow where it paused; approving resumes with the steps after it.
   *
   * Multiple approvers can be assigned to the same required step -- whichever
   * approver decides first resolves it (and resumes/stops the workflow);
   * later decisions from the remaining approvers on that same step are
   * recorded but don't trigger a second resume.
   */
  async resumeAfterApproval(
    approval: TicketsApprovals,
    decision: 'approved' | 'rejected',
  ): Promise<void> {
    if (!approval.workflowId || !approval.workflowStepId) return;

    const siblings = await this.approvals.find({
      where: {
        ticketId: approval.ticketId,
        workflowId: approval.workflowId,
        workflowStepId: approval.workflowStepId,
      },
    });
    const alreadyResolved = siblings.some(
      (s) => s.id !== approval.id && s.decidedAt,
    );
    if (alreadyResolved) return;

    const workflow = await this.workflows.findOneBy({ id: approval.workflowId });
    if (!workflow) return;

    await this.audit.log('TicketWorkflow', workflow.id, 'approval_decided', {
      ticketId: approval.ticketId,
      stepId: approval.workflowStepId,
      decision,
    });

    if (decision === 'rejected') {
      await this.audit.log('TicketWorkflow', workflow.id, 'finished', {
        ticketId: approval.ticketId,
        reason: 'approval_rejected',
      });
      return;
    }

    const ticket = await this.tickets.findOneBy({ id: approval.ticketId });
    if (!ticket) return;

    const ordered = [...(workflow.steps ?? [])].sort(
      (a, b) => a.order - b.order,
    );
    const stepIndex = ordered.findIndex((s) => s.id === approval.workflowStepId);
    const remaining = stepIndex >= 0 ? ordered.slice(stepIndex + 1) : [];

    const paused = await this.runSteps(ticket, workflow, remaining);
    if (!paused) {
      await this.audit.log('TicketWorkflow', workflow.id, 'finished', {
        ticketId: ticket.id,
      });
    }
  }

  /** Runs steps in order; stops early (returns true) at a paused approval. */
  private async runSteps(
    ticket: Tickets,
    workflow: TicketWorkflow,
    steps: WorkflowStep[],
  ): Promise<boolean> {
    for (const step of steps) {
      try {
        const pauseHere = await this.runStep(ticket, step, workflow.id);
        await this.audit.log('TicketWorkflow', workflow.id, 'step_ok', {
          ticketId: ticket.id,
          stepId: step.id,
          stepType: step.type,
        });
        if (pauseHere) {
          await this.audit.log('TicketWorkflow', workflow.id, 'paused', {
            ticketId: ticket.id,
            stepId: step.id,
          });
          return true;
        }
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
    return false;
  }

  /**
   * Runs a single step. Returns true if the workflow should pause here (only
   * ever true for a `request_approval` step with `config.required: true`) --
   * everything else runs fire-and-forget as before.
   */
  private async runStep(
    ticket: Tickets,
    step: WorkflowStep,
    workflowId: string,
  ): Promise<boolean> {
    const cfg = step.config ?? {};
    const url = `/admin/helpdesk/${ticket.id}`;

    switch (step.type) {
      case 'request_approval': {
        const approverIds: string[] =
          cfg.approverType === 'requesterManager'
            ? await this.resolveRequesterManagerId(ticket).then((id) =>
                id ? [id] : [],
              )
            : Array.isArray(cfg.approverIds)
              ? cfg.approverIds.filter((s: any) => typeof s === 'string')
              : [];
        if (approverIds.length === 0) {
          if (cfg.approverType === 'requesterManager') {
            this.logger.warn(
              `Workflow step ${step.id}: could not resolve requester's manager for ticket ${ticket.id}`,
            );
            // Can't actually request the approval (no manager on file to
            // send it to) -- leave a visible note instead of failing silent,
            // so the requester/agent knows this ticket still needs manager
            // sign-off and has to be handled manually.
            const note = this.comments.create({
              id: uuidv4(),
              ticketId: ticket.id,
              authorId: null,
              content:
                "This ticket requires approval from your manager, but no manager is on file for your account. Please contact an administrator to get this ticket approved.",
              type: 'Public',
            } as any);
            await this.comments.save(note);
          }
          return false;
        }

        const required = cfg.required === true;

        for (const approverId of approverIds) {
          const approval = this.approvals.create({
            id: uuidv4(),
            ticketId: ticket.id,
            requesterId: ticket.requesterId,
            approverId,
            workflowId: required ? workflowId : null,
            workflowStepId: required ? step.id : null,
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
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return required;
      }

      case 'notify': {
        const recipientIds: string[] = this.resolveRecipients(ticket, cfg);
        if (recipientIds.length === 0) return false;
        await this.dispatcher.dispatch({
          recipientIds,
          event: cfg.event ?? 'ticket_state_changed',
          title: cfg.title ?? `Ticket #${ticket.number} update`,
          body: cfg.body ?? '',
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return false;
      }

      case 'set_field': {
        const allowed = [
          'priority',
          'urgency',
          'impact',
          'assignmentGroup',
          'state',
          'category',
          'closureCode',
          'closureNotes',
        ];
        if (!allowed.includes(cfg.field)) {
          throw new Error(`field '${cfg.field}' not allowed`);
        }
        const oldValue = (ticket as any)[cfg.field] ?? null;
        await this.tickets.update(
          { id: ticket.id },
          { [cfg.field]: cfg.value },
        );
        // Reflect into the in-memory ticket too so later steps see the new value.
        (ticket as any)[cfg.field] = cfg.value;
        // set_field wrote the ticket row directly, bypassing updateTicket()'s
        // change-tracking loop -- log it ourselves so it shows up in the
        // ticket timeline the same way a manually-edited field would.
        if (oldValue !== cfg.value) {
          await this.activities.save({
            ticketId: ticket.id,
            userId: null,
            field: cfg.field,
            oldValue,
            newValue: cfg.value,
          } as any);
        }
        return false;
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
          url,
          entityType: 'Ticket',
          entityId: ticket.id,
        });
        return false;
      }

      case 'create_comment': {
        if (!cfg.content) return false;
        const comment = this.comments.create({
          id: uuidv4(),
          ticketId: ticket.id,
          authorId: cfg.authorId ?? null,
          content: String(cfg.content),
          type: cfg.type === 'Worknote' ? 'Worknote' : 'Public',
        } as any);
        await this.comments.save(comment);
        return false;
      }

      case 'add_attachment': {
        if (!cfg.attachmentPath || !cfg.attachmentName) return false;
        const comment = this.comments.create({
          id: uuidv4(),
          ticketId: ticket.id,
          authorId: cfg.authorId ?? null,
          content: cfg.message ? String(cfg.message) : null,
          type: cfg.type === 'Worknote' ? 'Worknote' : 'Public',
          attachmentName: String(cfg.attachmentName),
          attachmentPath: String(cfg.attachmentPath),
          attachmentMimetype: cfg.attachmentMimetype ?? null,
          attachmentSize: cfg.attachmentSize ?? null,
        } as any);
        await this.comments.save(comment);
        return false;
      }

      default:
        throw new Error(`unknown step type: ${step.type}`);
    }
  }

  /**
   * Stores a step's template file on disk once, at editor-config time --
   * every ticket the `add_attachment` step later fires for reuses the same
   * stored copy (path saved into the step's `config`), it isn't re-uploaded
   * per run.
   */
  uploadStepAttachment(file: any): {
    attachmentName: string;
    attachmentPath: string;
    attachmentMimetype: string;
    attachmentSize: number;
  } {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_STEP_ATTACHMENT_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    if (!fs.existsSync(STEP_ATTACHMENT_DIR)) {
      fs.mkdirSync(STEP_ATTACHMENT_DIR, { recursive: true });
    }

    const id = uuidv4();
    const ext = path.extname(file.originalname) || '';
    const storedName = `${id}${ext}`;
    const filePath = path.join(STEP_ATTACHMENT_DIR, storedName);
    fs.writeFileSync(filePath, file.buffer);

    return {
      attachmentName: file.originalname,
      attachmentPath: filePath,
      attachmentMimetype: file.mimetype,
      attachmentSize: file.size,
    };
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

  /**
   * `Users.manager` is the raw AD `manager` attribute (a distinguished name),
   * which lines up with `Users.distinguishedName` for AD-synced accounts --
   * so the requester's manager is just another Users row with a matching DN.
   * Returns null (no error) if the requester has no manager on file or the
   * manager hasn't been synced into InfraPilot as a user yet -- e.g. M365-only
   * tenants without AD sync never populate `manager` at all.
   */
  private async resolveRequesterManagerId(ticket: Tickets): Promise<string | null> {
    if (!ticket.requesterId) return null;
    const requester = await this.users.findOneBy({ id: ticket.requesterId });
    if (!requester?.manager) return null;
    const manager = await this.users.findOneBy({
      distinguishedName: requester.manager,
    });
    return manager?.id ?? null;
  }
}
