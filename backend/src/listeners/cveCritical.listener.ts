import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Applications } from 'src/entities/applications.entity';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { EVENTS } from 'src/events/events.constants';
import { CveCriticalDetectedEvent } from 'src/events/cve-critical-detected.event';

/**
 * CveService.reconcile() has emitted CVE_CRITICAL_DETECTED since it was
 * built, but nothing was ever listening -- the event fired into the void.
 * This is the missing listener: turns a newly-discovered CRITICAL-severity
 * CVE match into an ops alert (see cve_critical in OPS_ROUTED_EVENTS).
 */
@Injectable()
export class CveCriticalListener {
  private readonly logger = new Logger(CveCriticalListener.name);

  constructor(
    @InjectRepository(Applications)
    private readonly applicationsRepo: Repository<Applications>,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  @OnEvent(EVENTS.CVE_CRITICAL_DETECTED)
  async handleCveCriticalDetected(
    event: CveCriticalDetectedEvent,
  ): Promise<void> {
    try {
      const app = await this.applicationsRepo.findOneBy({
        id: event.applicationId,
      });
      const appLabel = app
        ? `${app.name}${event.version ? ` ${event.version}` : ''}`
        : event.applicationId;

      await this.dispatcher.dispatchOpsAlert({
        event: 'cve_critical',
        title: `Critical CVE detected: ${event.cveId}`,
        body: `${event.cveId} affects ${appLabel}, currently installed on one or more devices.`,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to dispatch cve_critical alert for ${event.cveId}: ${(err as Error).message}`,
      );
    }
  }
}
