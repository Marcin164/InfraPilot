import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { SoftwareLicenseAssignment } from 'src/entities/softwareLicenseAssignment.entity';
import {
  CreateAssignmentDto,
  CreateLicenseDto,
  UpdateLicenseDto,
} from 'src/dto/softwareLicense.dto';
import { uuidv4 } from 'src/helpers/uuidv4';
import { invalidateReportCache } from 'src/helpers/reportCache';

function invalidateLicenseReports() {
  invalidateReportCache('licenses-expiring-soon');
  invalidateReportCache('licenses-seat-utilization');
}

@Injectable()
export class SoftwareLicenseService {
  private readonly logger = new Logger(SoftwareLicenseService.name);

  constructor(
    @InjectRepository(SoftwareLicense)
    private readonly licenseRepo: Repository<SoftwareLicense>,
    @InjectRepository(SoftwareLicenseAssignment)
    private readonly assignmentRepo: Repository<SoftwareLicenseAssignment>,
  ) {}

  async findAll(): Promise<(SoftwareLicense & { usedSeats: number })[]> {
    const licenses = await this.licenseRepo.find({
      order: { createdAt: 'DESC' },
    });

    const counts = await this.assignmentRepo
      .createQueryBuilder('a')
      .select('a.licenseId', 'licenseId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.licenseId')
      .getRawMany<{ licenseId: string; count: string }>();

    const countMap = new Map(counts.map((r) => [r.licenseId, Number(r.count)]));

    return licenses.map((l) => ({
      ...l,
      usedSeats: countMap.get(l.id) ?? 0,
    }));
  }

  async findOne(id: string): Promise<SoftwareLicense & { usedSeats: number }> {
    const license = await this.licenseRepo.findOneBy({ id });
    if (!license) throw new NotFoundException('License not found');
    const usedSeats = await this.assignmentRepo.countBy({ licenseId: id });
    return { ...license, usedSeats };
  }

  async create(dto: CreateLicenseDto): Promise<SoftwareLicense> {
    const license = this.licenseRepo.create({ ...dto, id: uuidv4() });
    const saved = await this.licenseRepo.save(license);
    invalidateLicenseReports();
    return saved;
  }

  async update(id: string, dto: UpdateLicenseDto): Promise<SoftwareLicense> {
    const license = await this.licenseRepo.findOneBy({ id });
    if (!license) throw new NotFoundException('License not found');
    Object.assign(license, dto);
    const saved = await this.licenseRepo.save(license);
    invalidateLicenseReports();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const license = await this.licenseRepo.findOneBy({ id });
    if (!license) throw new NotFoundException('License not found');
    await this.licenseRepo.remove(license);
    invalidateLicenseReports();
  }

  async getAssignments(licenseId: string): Promise<SoftwareLicenseAssignment[]> {
    return this.assignmentRepo.find({
      where: { licenseId },
      relations: ['device', 'user'],
      order: { assignedAt: 'DESC' },
    });
  }

  async assign(dto: CreateAssignmentDto): Promise<SoftwareLicenseAssignment> {
    if (!dto.deviceId && !dto.userId) {
      throw new BadRequestException('deviceId or userId is required');
    }

    const license = await this.licenseRepo.findOneBy({ id: dto.licenseId });
    if (!license) throw new NotFoundException('License not found');

    if (license.totalSeats !== null) {
      const used = await this.assignmentRepo.countBy({ licenseId: dto.licenseId });
      if (used >= license.totalSeats) {
        throw new BadRequestException(
          `License seat limit reached (${license.totalSeats})`,
        );
      }
    }

    const assignment = this.assignmentRepo.create({
      id: uuidv4(),
      licenseId: dto.licenseId,
      deviceId: dto.deviceId ?? null,
      userId: dto.userId ?? null,
    });
    const saved = await this.assignmentRepo.save(assignment);
    invalidateLicenseReports();
    return saved;
  }

  async unassign(assignmentId: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOneBy({ id: assignmentId });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assignmentRepo.remove(assignment);
    invalidateLicenseReports();
  }

  /** Returns licenses expiring within the given number of days (for alerts). */
  async findExpiringSoon(days: number): Promise<SoftwareLicense[]> {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return this.licenseRepo
      .createQueryBuilder('l')
      .where('l.expiresAt IS NOT NULL')
      .andWhere('l.expiresAt > :now', { now: now.toISOString().slice(0, 10) })
      .andWhere('l.expiresAt <= :cutoff', {
        cutoff: cutoff.toISOString().slice(0, 10),
      })
      .getMany();
  }

  /** Returns licenses that expired on a specific date (for daily expired alert). */
  async findExpiredOn(date: Date): Promise<SoftwareLicense[]> {
    const dateStr = date.toISOString().slice(0, 10);
    return this.licenseRepo
      .createQueryBuilder('l')
      .where('l.expiresAt IS NOT NULL')
      .andWhere('l.expiresAt = :date', { date: dateStr })
      .getMany();
  }
}
