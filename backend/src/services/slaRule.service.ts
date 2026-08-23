import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';
import { SlaRule, TicketType } from 'src/entities/slaRule.entity';
import { TicketPriority } from 'src/entities/tickets.entity';
import { DataSource, In, IsNull, Repository } from 'typeorm';

@Injectable()
export class SlaRuleService {
  constructor(
    @InjectRepository(SlaRule)
    private readonly ruleRepo: Repository<SlaRule>,

    @InjectRepository(SlaDefinition)
    private readonly slaRepo: Repository<SlaDefinition>,

    private readonly dataSource: DataSource,
  ) {}

  async getAll() {
    return this.ruleRepo.find({
      relations: ['slaDefinition'],
      order: { priority: 'ASC' },
    });
  }

  async create(dto: {
    priority: TicketPriority;
    definitionId: string;
    ticketType?: TicketType | null;
  }) {
    const sla = await this.slaRepo.findOne({
      where: { id: dto.definitionId },
    });

    if (!sla) {
      throw new NotFoundException('SLA definition not found');
    }

    // Replace any existing rule for this exact (priority, ticketType) slot only --
    // must not touch other ticketType/definition rows sharing the same priority.
    await this.ruleRepo.delete({
      priority: dto.priority,
      ticketType: dto.ticketType ?? IsNull(),
    });

    const rule = this.ruleRepo.create({
      priority: dto.priority,
      ticketType: dto.ticketType ?? null,
      slaDefinition: sla,
    });

    return this.ruleRepo.save(rule);
  }

  async update(
    id: string,
    dto: {
      priority?: TicketPriority;
      ticketType?: TicketType | null;
      definitionId?: string;
    },
  ) {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['slaDefinition'],
    });

    if (!rule) {
      throw new NotFoundException('SLA rule not found');
    }

    if (dto.definitionId) {
      const sla = await this.slaRepo.findOne({
        where: { id: dto.definitionId },
      });

      if (!sla) {
        throw new NotFoundException('SLA definition not found');
      }

      rule.slaDefinition = sla;
    }

    if (dto.priority !== undefined) rule.priority = dto.priority;
    if (dto.ticketType !== undefined) rule.ticketType = dto.ticketType;

    return this.ruleRepo.save(rule);
  }

  // Replaces the entire priority x ticketType grid in one transaction --
  // the matrix editor always submits its full desired state, so a clean
  // wipe-and-reinsert is simpler and safer than diffing than the old
  // per-cell create()'s ad-hoc delete-before-insert.
  async replaceMatrix(
    entries: { priority: TicketPriority; ticketType?: TicketType | null; definitionId: string }[],
  ) {
    const slots = new Set<string>();
    for (const entry of entries) {
      const key = `${entry.priority}|${entry.ticketType ?? ''}`;
      if (slots.has(key)) {
        throw new BadRequestException(
          `Duplicate rule for priority=${entry.priority}, ticketType=${entry.ticketType ?? 'Any'}`,
        );
      }
      slots.add(key);
    }

    const definitionIds = [...new Set(entries.map((e) => e.definitionId))];
    if (definitionIds.length) {
      const definitions = await this.slaRepo.findBy({ id: In(definitionIds) });
      if (definitions.length !== definitionIds.length) {
        throw new NotFoundException('One or more SLA definitions not found');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const ruleRepo = manager.getRepository(SlaRule);
      await ruleRepo.createQueryBuilder().delete().from(SlaRule).execute();

      const rows = entries.map((entry) =>
        ruleRepo.create({
          priority: entry.priority,
          ticketType: entry.ticketType ?? null,
          slaDefinition: { id: entry.definitionId } as SlaDefinition,
        }),
      );

      return rows.length ? ruleRepo.save(rows) : [];
    });
  }

  async delete(id: string) {
    const rule = await this.ruleRepo.findOne({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('SLA rule not found');
    }

    await this.ruleRepo.remove(rule);
    return { deleted: true };
  }
}
