import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentTaskService } from 'src/services/agentTask.service';
import { IpamService } from 'src/services/ipam.service';
import { AgentTask } from 'src/entities/agentTask.entity';

const DEFAULT_INTERVAL_HOURS = 12;

/**
 * Periodically queues a `network_scan` agent task for every subnet that
 * has a Windows agent stationed at its location -- the automatic
 * counterpart to the manual "Scan this subnet" button (both go through
 * the same AgentTaskService.enqueue()/DevicesController.completeTask()
 * path, so ingestion doesn't need to know which one triggered it).
 * Candidate-device selection is shared with that button via
 * IpamService.findScanCandidates().
 *
 * Runs a fixed hourly check independent of the configured scan interval,
 * so NETWORK_SCAN_INTERVAL_HOURS can change without a redeploy of the
 * cron schedule itself.
 */
@Injectable()
export class NetworkScanWorker {
  private readonly logger = new Logger(NetworkScanWorker.name);

  constructor(
    private readonly agentTasks: AgentTaskService,
    private readonly ipamService: IpamService,
    @InjectRepository(AgentTask)
    private readonly taskRepo: Repository<AgentTask>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweepSubnets() {
    try {
      const created = await this.runOnce();
      if (created > 0) {
        this.logger.log(`Queued ${created} scheduled network_scan task(s)`);
      }
    } catch (err) {
      this.logger.warn(`Scheduled network scan sweep failed: ${(err as Error).message}`);
    }
  }

  async runOnce(): Promise<number> {
    const intervalHours =
      Number(process.env.NETWORK_SCAN_INTERVAL_HOURS) || DEFAULT_INTERVAL_HOURS;
    const cutoff = new Date(Date.now() - intervalHours * 60 * 60 * 1000);

    const subnets = await this.ipamService.findAllSubnets();
    let created = 0;

    for (const subnet of subnets) {
      if (!subnet.locationId) continue;

      const recent = await this.findLatestForSubnet(subnet.id);
      if (recent && (this.isInFlight(recent) || recent.createdAt > cutoff)) {
        continue;
      }

      const [agentDevice] = await this.ipamService.findScanCandidates(subnet.id);
      if (!agentDevice) {
        this.logger.debug(`No Windows agent at location ${subnet.locationId} -- skipping subnet ${subnet.id}`);
        continue;
      }

      await this.agentTasks.enqueue({
        deviceId: agentDevice.id,
        type: 'network_scan',
        payload: { cidr: subnet.cidr, subnetId: subnet.id, auto: true },
        requestedBy: 'system:scheduled-scan',
      });
      created += 1;
    }
    return created;
  }

  private isInFlight(task: AgentTask): boolean {
    return task.state === 'queued' || task.state === 'leased';
  }

  private async findLatestForSubnet(subnetId: string): Promise<AgentTask | null> {
    return this.taskRepo
      .createQueryBuilder('t')
      .where('t.type = :type', { type: 'network_scan' })
      .andWhere("t.payload ->> 'subnetId' = :subnetId", { subnetId })
      .orderBy('t.createdAt', 'DESC')
      .limit(1)
      .getOne();
  }
}
