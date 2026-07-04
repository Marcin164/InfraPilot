import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboards } from 'src/entities/dashboards.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(Dashboards)
    private dashboardsRepository: Repository<Dashboards>,
  ) {}

  async findAll(): Promise<Dashboards[]> {
    return this.dashboardsRepository.find();
  }

  async createDashboard(name: string, userId: string): Promise<Dashboards> {
    const newDashboard = this.dashboardsRepository.create({
      id: uuidv4(),
      name,
      userId,
      cards: [],
    });

    return this.dashboardsRepository.save(newDashboard);
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.dashboardsRepository.delete(id);
  }

  async updateCards(id: string, cards: Record<string, any>[]): Promise<Dashboards> {
    await this.dashboardsRepository.update(id, { cards: cards as any });
    const updated = await this.dashboardsRepository.findOneBy({ id });
    if (!updated) throw new NotFoundException('Dashboard not found');
    return updated;
  }
}
