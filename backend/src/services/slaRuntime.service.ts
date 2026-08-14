import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { SlaPause } from 'src/entities/slaPause.entity';
import { BusinessTimeService } from './businessTime.service';

@Injectable()
export class SlaRuntimeService {
  constructor(
    @InjectRepository(SlaInstance)
    private readonly slaRepo: Repository<SlaInstance>,

    @InjectRepository(SlaEscalationInstance)
    private readonly escalationRepo: Repository<SlaEscalationInstance>,

    @InjectRepository(SlaPause)
    private readonly pauseRepo: Repository<SlaPause>,

    private readonly businessTime: BusinessTimeService,
  ) {}

  async getForTicket(ticketId: string) {
    const instances = await this.slaRepo.find({
      where: { ticketId },
      relations: ['slaDefinition', 'slaDefinition.calendar', 'slaDefinition.calendar.holidays'],
    });

    if (!instances.length) {
      throw new NotFoundException('No SLA for ticket');
    }

    const now = new Date();

    const result = await Promise.all(
      instances.map(async (instance) => {
        const totalMinutes = instance.slaDefinition.targetMinutes;
        const calendar = instance.slaDefinition.calendar;

        let remainingMinutes: number;

        if (instance.breached) {
          remainingMinutes = 0;
        } else if (instance.paused) {
          // Freeze the clock at the moment it was paused -- dueAt only
          // moves forward on resume (slaPause.service.ts), so measuring
          // from `now` here would keep counting down a "paused" SLA.
          const openPause = await this.pauseRepo.findOne({
            where: { slaInstance: { id: instance.id }, resumedAt: IsNull() },
          });
          remainingMinutes = await this.businessTime.calculateBusinessMinutesBetween(
            openPause?.pausedAt ?? now,
            instance.dueAt,
            calendar,
          );
        } else {
          remainingMinutes = await this.businessTime.calculateBusinessMinutesBetween(
            now,
            instance.dueAt,
            calendar,
          );
        }

        remainingMinutes = Math.max(remainingMinutes, 0);

        const usedMinutes = Math.max(totalMinutes - remainingMinutes, 0);

        const usedPercentage = Math.min(
          Math.round((usedMinutes / totalMinutes) * 100),
          100,
        );

        const status = instance.breached
          ? 'BREACHED'
          : instance.paused
            ? 'PAUSED'
            : 'ACTIVE';

        return {
          id: instance.id,

          type: instance.slaDefinition.type,
          name: instance.slaDefinition.name,

          status,
          paused: instance.paused,
          breached: instance.breached,

          dueAt: instance.dueAt,
          remainingMinutes,
          usedPercentage,

          targetMinutes: totalMinutes,
        };
      }),
    );

    return {
      instances: result,
    };
  }
}
