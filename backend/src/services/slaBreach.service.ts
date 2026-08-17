import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { SlaType } from 'src/entities/slaDefinition.entity';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';

@Injectable()
export class SlaBreachService {
  constructor(
    @InjectRepository(SlaInstance)
    private readonly repo: Repository<SlaInstance>,

    private readonly audit: AuditService,
  ) {}

  async finishSla(ticketId: string, manager?: any) {
    const repository = manager ? manager.getRepository(SlaInstance) : this.repo;

    const instances = await repository.find({
      where: { ticketId },
    });

    for (const inst of instances) {
      inst.breached = new Date() > inst.dueAt;
      await repository.save(inst);

      if (inst.breached) {
        await this.audit.log(
          'SLA_INSTANCE',
          inst.id,
          'SLA_BREACHED',
          {
            ticketId,
            dueAt: inst.dueAt,
          },
          manager,
        );
      }
    }
  }

  // Records that staff actually replied, independent of `breached` --
  // a Response SLA that was missed stays breached (that already happened),
  // but this stops it from looking like an unanswered ticket forever.
  // Only the first reply counts; later ones are no-ops.
  async markFirstResponse(ticketId: string, manager?: any) {
    const repository = manager ? manager.getRepository(SlaInstance) : this.repo;

    const instances = await repository.find({
      where: { ticketId },
      relations: ['slaDefinition'],
    });

    const now = new Date();
    for (const inst of instances) {
      if (inst.slaDefinition?.type !== SlaType.RESPONSE) continue;
      if (inst.respondedAt) continue;
      inst.respondedAt = now;
      await repository.save(inst);
    }
  }
}
