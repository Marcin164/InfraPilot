import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shift } from "src/entities/shift.entity";
import { Users } from "src/entities/users.entity";
import { Repository } from "typeorm";
import { CreateShiftDto, UpdateShiftDto } from "src/dto/shift.dto";

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly repo: Repository<Shift>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  async getShifts(spaceId: string, category?: string) {
    return this.repo.find();
  }

  private async findOverlapping(
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ) {
    const query = this.repo
      .createQueryBuilder('shift')
      .where('shift.userId = :userId', { userId })
      .andWhere('shift.startDate < :endDate', { endDate })
      .andWhere('shift.endDate > :startDate', { startDate });
    if (excludeId) query.andWhere('shift.id != :excludeId', { excludeId });
    return query.getOne();
  }

  // Only an admin, or the specific employee's manager, may create/edit/
  // delete their shifts. "Manager" is matched against the free-text
  // Users.manager field (currently an AD distinguished name, moving to a
  // plain username) — checked against every identifier we have for the
  // caller so it keeps working through that migration.
  private async assertCanManage(callerId: string, targetUserId: string) {
    const caller = await this.usersRepo.findOneBy({ id: callerId });
    if (caller?.isAdmin) return;

    const target = await this.usersRepo.findOneBy({ id: targetUserId });
    const managerRef = target?.manager;
    const callerIdentifiers = [caller?.username, caller?.distinguishedName, caller?.id].filter(Boolean);
    const isManager = !!managerRef && callerIdentifiers.includes(managerRef);
    if (isManager) return;

    throw new ForbiddenException(
      'Only this employee\'s manager (or an admin) can manage their shifts',
    );
  }

  async create(dto: CreateShiftDto, callerId: string) {
    await this.assertCanManage(callerId, dto.userId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const overlapping = await this.findOverlapping(
      dto.userId,
      startDate,
      endDate,
    );
    if (overlapping) {
      throw new BadRequestException(
        'Shift dates overlap with an existing shift for this user',
      );
    }

    const shift = this.repo.create({
      userId: dto.userId,
      type: dto.type,
      startDate,
      endDate,
    });
    return this.repo.save(shift);
  }

    async updateShifts(spaceId: string, category?: string) {
    return this.repo.find({
    });
  }

  async update(id: string, dto: UpdateShiftDto, callerId: string) {
    const shift = await this.repo.findOneBy({ id });
    if (!shift) throw new NotFoundException('Shift not found');

    await this.assertCanManage(callerId, shift.userId);

    const startDate = dto.startDate !== undefined ? new Date(dto.startDate) : shift.startDate;
    const endDate = dto.endDate !== undefined ? new Date(dto.endDate) : shift.endDate;

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      const overlapping = await this.findOverlapping(shift.userId, startDate, endDate, id);
      if (overlapping) {
        throw new BadRequestException(
          'Shift dates overlap with an existing shift for this user',
        );
      }
    }

    shift.startDate = startDate;
    shift.endDate = endDate;
    if (dto.type !== undefined) shift.type = dto.type;
    if (dto.comment !== undefined) shift.comment = dto.comment;

    return this.repo.save(shift);
  }

  async remove(id: string, callerId: string) {
    const shift = await this.repo.findOneBy({ id });
    if (!shift) throw new NotFoundException('Shift not found');

    await this.assertCanManage(callerId, shift.userId);

    await this.repo.remove(shift);
    return { id };
  }
}
