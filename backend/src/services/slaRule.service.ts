import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';
import { SlaRule, TicketType } from 'src/entities/slaRule.entity';
import { TicketPriority } from 'src/entities/tickets.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SlaRuleService {
  constructor(
    @InjectRepository(SlaRule)
    private readonly ruleRepo: Repository<SlaRule>,

    @InjectRepository(SlaDefinition)
    private readonly slaRepo: Repository<SlaDefinition>,
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

    // opcjonalnie: usuń istniejącą regułę dla priority
    await this.ruleRepo.delete({ priority: dto.priority });

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
