import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Devices } from 'src/entities/devices.entity';
import { AuditService } from './audit.service';

/**
 * Pull stable identifiers out of an agent scan payload. We don't trust any
 * single identifier — TPM is best, MAC list is next, CPU id and baseboard
 * serial are tiebreakers.
 */
export function extractFingerprint(scan: any): {
  tpmFingerprint: string | null;
  macAddresses: string[] | null;
  cpuId: string | null;
} {
  const tpmEk =
    scan?.security?.tpm?.endorsement_key ??
    scan?.security?.tpm?.ek ??
    scan?.hardware?.tpm?.endorsement_key ??
    null;
  const tpmFingerprint =
    typeof tpmEk === 'string' && tpmEk.trim()
      ? createHash('sha256').update(tpmEk.trim()).digest('hex')
      : null;

  const seen = new Set<string>();
  const collectMacs = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const v of node) collectMacs(v);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (
        typeof v === 'string' &&
        /mac|hardware_address|hwaddr/i.test(k) &&
        /^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i.test(v.trim())
      ) {
        seen.add(v.trim().toUpperCase().replace(/-/g, ':'));
      } else if (typeof v === 'object') {
        collectMacs(v);
      }
    }
  };
  collectMacs(scan?.network);
  collectMacs(scan?.hardware);
  const macAddresses = seen.size > 0 ? Array.from(seen).sort() : null;

  const cpuRaw =
    scan?.hardware?.cpu?.processor_id ??
    scan?.hardware?.cpu?.id ??
    scan?.hardware?.processor?.id ??
    null;
  const cpuId =
    typeof cpuRaw === 'string' && cpuRaw.trim() ? cpuRaw.trim() : null;

  return { tpmFingerprint, macAddresses, cpuId };
}

export type MergeCandidate = {
  device: Devices;
  score: number;
  reasons: string[];
};

@Injectable()
export class DeviceIdentityService {
  private readonly logger = new Logger(DeviceIdentityService.name);

  constructor(
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Update the identity fingerprint columns based on a fresh scan. Called
   * from `recordScan` so identity is always current. Never overwrites with
   * null — once we've seen a TPM, we keep it.
   */
  async updateFromScan(deviceId: string, scan: any): Promise<void> {
    const fp = extractFingerprint(scan);
    const patch: Partial<Devices> = {};
    if (fp.tpmFingerprint) patch.tpmFingerprint = fp.tpmFingerprint;
    if (fp.macAddresses && fp.macAddresses.length > 0) {
      patch.macAddresses = fp.macAddresses;
    }
    if (fp.cpuId) patch.cpuId = fp.cpuId;
    if (Object.keys(patch).length === 0) return;
    await this.devices.update({ id: deviceId }, patch);
  }

  /**
   * Look for other devices whose identifiers overlap with this one. Used
   * to suggest merge candidates after a reformat / motherboard swap. Skips
   * devices that have already been merged elsewhere.
   */
  async findMergeCandidates(deviceId: string): Promise<MergeCandidate[]> {
    const target = await this.devices.findOneBy({ id: deviceId });
    if (!target) throw new NotFoundException('Device not found');

    const allOthers = await this.devices.find({
      where: { id: Not(deviceId), mergedIntoId: IsNull() },
    });

    const out: MergeCandidate[] = [];
    for (const other of allOthers) {
      const reasons: string[] = [];
      let score = 0;

      if (
        target.tpmFingerprint &&
        other.tpmFingerprint &&
        target.tpmFingerprint === other.tpmFingerprint
      ) {
        reasons.push('matching TPM fingerprint');
        score += 100;
      }

      if (
        target.cpuId &&
        other.cpuId &&
        target.cpuId === other.cpuId
      ) {
        reasons.push('matching CPU id');
        score += 50;
      }

      if (target.macAddresses && other.macAddresses) {
        const a = new Set(target.macAddresses);
        const b = new Set(other.macAddresses);
        const overlap = [...a].filter((m) => b.has(m));
        if (overlap.length > 0) {
          const ratio =
            overlap.length / Math.max(a.size, b.size);
          reasons.push(
            `${overlap.length}/${Math.max(a.size, b.size)} MAC matches`,
          );
          score += Math.round(40 * ratio);
        }
      }

      if (
        target.serialNumber &&
        other.serialNumber &&
        target.serialNumber === other.serialNumber
      ) {
        reasons.push('matching baseboard serial');
        score += 30;
      }

      if (
        target.assetName &&
        other.assetName &&
        target.assetName === other.assetName
      ) {
        reasons.push('matching hostname');
        score += 10;
      }

      if (score >= 30) {
        out.push({ device: other, score, reasons });
      }
    }

    out.sort((x, y) => y.score - x.score);
    return out.slice(0, 10);
  }

  /**
   * Merge `source` into `target`. All foreign-keyed children get repointed
   * to `target.id`. The source row stays around with `mergedIntoId` set
   * so the chain of custody remains intact (and the agent secret on the
   * source is cleared so it can't keep posting scans against a stale id).
   */
  async merge(
    targetId: string,
    sourceId: string,
    actorId: string | null,
  ): Promise<{
    target: string;
    source: string;
    moved: Record<string, number>;
  }> {
    if (targetId === sourceId) {
      throw new BadRequestException('Cannot merge a device into itself');
    }
    const target = await this.devices.findOneBy({ id: targetId });
    if (!target) throw new NotFoundException('Target device not found');
    const source = await this.devices.findOneBy({ id: sourceId });
    if (!source) throw new NotFoundException('Source device not found');
    if (target.mergedIntoId) {
      throw new BadRequestException(
        'Target device is itself merged — pick the canonical record',
      );
    }
    if (source.mergedIntoId) {
      throw new BadRequestException('Source device is already merged');
    }

    const moved: Record<string, number> = {};

    // Move FKs in a single transaction so partial merge can't leave stragglers.
    await this.dataSource.transaction(async (em) => {
      const repoint = async (
        sql: string,
        params: any[],
        key: string,
      ) => {
        const result = await em.query(sql, params);
        moved[key] = Number(result?.[1] ?? result?.affected ?? 0);
      };

      // Tickets
      await repoint(
        `UPDATE tickets SET "deviceId" = $1 WHERE "deviceId" = $2`,
        [targetId, sourceId],
        'tickets',
      );
      // Device scans
      await repoint(
        `UPDATE device_scan SET "deviceId" = $1 WHERE "deviceId" = $2`,
        [targetId, sourceId],
        'deviceScans',
      );
      // Software installs
      await repoint(
        `UPDATE devices_applications SET "deviceId" = $1 WHERE "deviceId" = $2`,
        [targetId, sourceId],
        'softwareInstalls',
      );
      // Agent tasks
      await repoint(
        `UPDATE agent_task SET "deviceId" = $1 WHERE "deviceId" = $2`,
        [targetId, sourceId],
        'agentTasks',
      );
      // Tag mappings
      await repoint(
        `UPDATE device_tag_map SET "deviceId" = $1 WHERE "deviceId" = $2 AND NOT EXISTS (SELECT 1 FROM device_tag_map dtm2 WHERE dtm2."deviceId" = $1 AND dtm2."tagId" = device_tag_map."tagId")`,
        [targetId, sourceId],
        'tagMaps',
      );
      // Drop any leftover (duplicate) tag rows after dedup-aware update.
      await em.query(`DELETE FROM device_tag_map WHERE "deviceId" = $1`, [
        sourceId,
      ]);
      // Compliance results
      await repoint(
        `UPDATE compliance_result SET "deviceId" = $1 WHERE "deviceId" = $2 AND NOT EXISTS (SELECT 1 FROM compliance_result cr2 WHERE cr2."deviceId" = $1 AND cr2."ruleKey" = compliance_result."ruleKey")`,
        [targetId, sourceId],
        'complianceResults',
      );
      await em.query(
        `DELETE FROM compliance_result WHERE "deviceId" = $1`,
        [sourceId],
      );

      // Stamp source as merged + clear its agent secret so it can't post.
      await em
        .createQueryBuilder()
        .update(Devices)
        .set({
          mergedIntoId: targetId,
          mergedAt: new Date(),
          apiSecretHash: null,
          apiSecretHashPrev: null,
          apiSecretPrevValidUntil: null,
        })
        .where('id = :id', { id: sourceId })
        .execute();

      // Inherit identity bits the source had if target lacks them.
      const inherit: Partial<Devices> = {};
      if (!target.tpmFingerprint && source.tpmFingerprint) {
        inherit.tpmFingerprint = source.tpmFingerprint;
      }
      if (!target.cpuId && source.cpuId) inherit.cpuId = source.cpuId;
      if (
        (!target.macAddresses || target.macAddresses.length === 0) &&
        source.macAddresses
      ) {
        inherit.macAddresses = source.macAddresses;
      } else if (target.macAddresses && source.macAddresses) {
        const merged = Array.from(
          new Set([...target.macAddresses, ...source.macAddresses]),
        ).sort();
        inherit.macAddresses = merged;
      }
      if (Object.keys(inherit).length > 0) {
        await em.update(Devices, { id: targetId }, inherit);
      }
    });

    await this.audit.log('Device', targetId, 'merged_in', {
      sourceId,
      sourceAssetName: source.assetName,
      sourceSerial: source.serialNumber,
      moved,
      actor: actorId,
    });
    await this.audit.log('Device', sourceId, 'merged_into', {
      targetId,
      moved,
      actor: actorId,
    });

    return { target: targetId, source: sourceId, moved };
  }
}
