import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Calendar } from 'src/entities/calendar.entity';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SlaDefinitionService {
  constructor(
    @InjectRepository(SlaDefinition)
    private readonly slaRepo: Repository<SlaDefinition>,

    @InjectRepository(Calendar)
    private readonly calendarRepo: Repository<Calendar>,
  ) {}

  async getAll() {
    return this.slaRepo.find({
      relations: ['calendar'],
      order: { name: 'ASC' },
    });
  }

  async create(dto: {
    name: string;
    calendarId: string;
    responseMinutes?: number;
    resolutionMinutes?: number;
  }) {
    if (!dto.responseMinutes && !dto.resolutionMinutes) {
      throw new BadRequestException(
        'At least one of responseMinutes or resolutionMinutes is required',
      );
    }

    const calendar = await this.calendarRepo.findOne({
      where: { id: dto.calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const sla = this.slaRepo.create({
      name: dto.name,
      responseMinutes: dto.responseMinutes ?? null,
      resolutionMinutes: dto.resolutionMinutes ?? null,
      calendar,
    });

    return this.slaRepo.save(sla);
  }

  async update(id: string, dto: any) {
    const sla = await this.slaRepo.findOne({
      where: { id },
      relations: ['calendar'],
    });

    if (!sla) {
      throw new NotFoundException('SLA definition not found');
    }

    if (dto.calendarId) {
      const calendar = await this.calendarRepo.findOne({
        where: { id: dto.calendarId },
      });

      if (!calendar) {
        throw new NotFoundException('Calendar not found');
      }

      sla.calendar = calendar;
    }

    if (dto.name !== undefined) sla.name = dto.name;
    if (dto.responseMinutes !== undefined) sla.responseMinutes = dto.responseMinutes;
    if (dto.resolutionMinutes !== undefined) sla.resolutionMinutes = dto.resolutionMinutes;

    if (!sla.responseMinutes && !sla.resolutionMinutes) {
      throw new BadRequestException(
        'At least one of responseMinutes or resolutionMinutes is required',
      );
    }

    return this.slaRepo.save(sla);
  }

  async delete(id: string) {
    const sla = await this.slaRepo.findOne({
      where: { id },
    });

    if (!sla) {
      throw new NotFoundException('SLA definition not found');
    }

    await this.slaRepo.remove(sla);
    return { deleted: true };
  }
}
