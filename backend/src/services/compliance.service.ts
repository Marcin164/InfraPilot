import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Devices } from 'src/entities/devices.entity';
import { ComplianceRule } from 'src/entities/complianceRule.entity';
import type {
  ComplianceOperator,
  ComplianceSeverity,
} from 'src/entities/complianceRule.entity';
import { ComplianceResult } from 'src/entities/complianceResult.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

// All fields optional: this DTO backs a single upsert endpoint (PUT
// rules/:key) that both creates and patches a rule, and the service already
// treats every field as independently patchable via Object.assign. Excludes
// `key`/`builtin`/`createdAt`/`updatedAt` on purpose — `key` comes from the
// URL param, and `builtin` must stay server-controlled (see deleteRule's
// built-in check, which a caller could otherwise flip off first).
export class UpsertComplianceRuleDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string | null;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsString()
  jsonPath?: string;

  @IsOptional()
  @IsIn(['eq', 'ne', 'gte', 'lte', 'exists', 'notExists', 'contains', 'notContains'])
  operator?: ComplianceOperator;

  @IsOptional()
  expected?: any;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: ComplianceSeverity;

  @IsOptional() @IsBoolean()
  enabled?: boolean;
}

export const BUILTIN_RULES: Array<
  Omit<
    ComplianceRule,
    'createdAt' | 'updatedAt' | 'builtin' | 'enabled'
  > & { enabled?: boolean }
> = [
  {
    key: 'bitlocker-enabled',
    name: 'BitLocker enabled on at least one drive',
    description:
      'At least one BitLocker volume reports ProtectionStatus On. Does not verify the OS drive specifically -- the agent reports all volumes as a flat list with no reliable "this is the system drive" flag exposed to the rule engine.',
    category: 'security',
    jsonPath: 'security.bitlocker[].ProtectionStatus',
    operator: 'eq',
    expected: 1,
    severity: 'HIGH',
  },
  {
    key: 'firewall-on',
    name: 'Windows Firewall active',
    description: 'At least one firewall profile (Domain/Private/Public) reports enabled.',
    category: 'security',
    jsonPath: 'security.firewall_profile[].Enabled',
    operator: 'eq',
    expected: 1,
    severity: 'HIGH',
  },
  {
    key: 'antivirus-running',
    name: 'Antivirus product registered',
    description:
      'An AV product is registered with Windows Security Center. Does not verify it is actively running/up to date -- that requires decoding the undocumented productState bitmask, which this rule engine does not attempt.',
    category: 'security',
    jsonPath: 'security.antivirus[].displayName',
    operator: 'exists',
    expected: null,
    severity: 'HIGH',
  },
  {
    key: 'os-version-present',
    name: 'Operating system version reported',
    description: 'Agent must be able to collect an OS version.',
    category: 'hygiene',
    jsonPath: 'system.os_version',
    operator: 'exists',
    expected: null,
    severity: 'LOW',
  },
  {
    key: 'tpm-present',
    name: 'TPM module present and enabled',
    description: 'Device must expose an enabled TPM module.',
    category: 'security',
    jsonPath: 'security.tpm.IsEnabled_InitialValue',
    operator: 'eq',
    expected: true,
    severity: 'MEDIUM',
  },
];

function readPath(obj: any, path: string): any {
  if (obj === null || obj === undefined) return undefined;
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Most agent-reported fields (bitlocker volumes, firewall profiles, AV
 * products) are arrays with no single scalar to compare -- `[]` marks the
 * array boundary in a jsonPath, e.g. `security.bitlocker[].ProtectionStatus`
 * reads `.ProtectionStatus` off every element. evaluateDevice() then checks
 * whether *any* element satisfies the rule (existential, not universal --
 * matches the common "at least one X is on" phrasing of these checks).
 */
function isArrayPath(path: string): boolean {
  return path.includes('[]');
}

function readArrayPath(obj: any, path: string): any[] | undefined {
  const markerIndex = path.indexOf('[]');
  const arrayPath = path.slice(0, markerIndex);
  const elementPath = path.slice(markerIndex + 2).replace(/^\./, '');
  const arr = readPath(obj, arrayPath);
  if (!Array.isArray(arr)) return undefined;
  if (!elementPath) return arr;
  return arr.map((item) => readPath(item, elementPath));
}

function evaluate(
  operator: ComplianceOperator,
  actual: any,
  expected: any,
): { passed: boolean; message: string | null } {
  switch (operator) {
    case 'eq':
      return {
        passed: actual === expected,
        message: actual === expected ? null : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      };
    case 'ne':
      return {
        passed: actual !== expected,
        message: actual !== expected ? null : `unexpected value ${JSON.stringify(actual)}`,
      };
    case 'gte': {
      const ok =
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual >= expected;
      return { passed: ok, message: ok ? null : `${actual} < ${expected}` };
    }
    case 'lte': {
      const ok =
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual <= expected;
      return { passed: ok, message: ok ? null : `${actual} > ${expected}` };
    }
    case 'exists':
      return {
        passed: actual !== undefined && actual !== null,
        message: actual !== undefined && actual !== null ? null : 'value missing',
      };
    case 'notExists':
      return {
        passed: actual === undefined || actual === null,
        message: actual === undefined || actual === null ? null : 'value present but forbidden',
      };
    case 'contains': {
      const hay = String(actual ?? '');
      const needle = String(expected ?? '');
      return {
        passed: hay.includes(needle),
        message: hay.includes(needle)
          ? null
          : `"${hay}" does not contain "${needle}"`,
      };
    }
    case 'notContains': {
      const hay = String(actual ?? '');
      const needle = String(expected ?? '');
      return {
        passed: !hay.includes(needle),
        message: !hay.includes(needle)
          ? null
          : `"${hay}" contains forbidden "${needle}"`,
      };
    }
    default:
      return { passed: false, message: `unknown operator ${operator}` };
  }
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(ComplianceRule)
    private readonly rulesRepo: Repository<ComplianceRule>,
    @InjectRepository(ComplianceResult)
    private readonly resultsRepo: Repository<ComplianceResult>,
    @InjectRepository(Devices)
    private readonly devicesRepo: Repository<Devices>,
  ) {}

  /**
   * Inserts missing built-ins and re-syncs the *definition* (name,
   * description, jsonPath, operator, expected, severity, category) of ones
   * that already exist, so a jsonPath fix shipped in a later version reaches
   * installs that seeded the old rule long ago -- otherwise the corrected
   * BUILTIN_RULES entries never take effect on an existing database, since
   * the old seeding logic only inserted rows that didn't already exist by
   * key. `enabled` is deliberately left untouched: an admin's decision to
   * turn a built-in rule off must survive a definition sync.
   */
  async seedBuiltins(): Promise<number> {
    let inserted = 0;
    for (const r of BUILTIN_RULES) {
      const existing = await this.rulesRepo.findOneBy({ key: r.key });
      if (existing) {
        Object.assign(existing, {
          name: r.name,
          description: r.description,
          category: r.category,
          jsonPath: r.jsonPath,
          operator: r.operator,
          expected: r.expected,
          severity: r.severity,
        });
        await this.rulesRepo.save(existing);
        continue;
      }
      const row = this.rulesRepo.create({
        ...r,
        enabled: r.enabled ?? true,
        builtin: true,
      });
      await this.rulesRepo.save(row);
      inserted += 1;
    }
    return inserted;
  }

  async listRules() {
    return this.rulesRepo.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  async upsertRule(input: Partial<ComplianceRule> & { key: string }) {
    const existing = await this.rulesRepo.findOneBy({ key: input.key });
    if (existing) {
      Object.assign(existing, input);
      return this.rulesRepo.save(existing);
    }
    const row = this.rulesRepo.create({
      ...input,
      builtin: false,
      enabled: input.enabled ?? true,
    } as ComplianceRule);
    return this.rulesRepo.save(row);
  }

  async deleteRule(key: string) {
    const existing = await this.rulesRepo.findOneBy({ key });
    if (!existing) return;
    await this.rulesRepo.delete({ key });
  }

  async evaluateDevice(deviceId: string): Promise<ComplianceResult[]> {
    const device = await this.devicesRepo.findOneBy({ id: deviceId });
    if (!device) return [];

    const rules = await this.rulesRepo.findBy({ enabled: true });
    const now = new Date();
    const out: ComplianceResult[] = [];

    for (const rule of rules) {
      let actual: any;
      let passed: boolean;
      let message: string | null;

      if (isArrayPath(rule.jsonPath)) {
        const values = readArrayPath(device, rule.jsonPath);
        actual = values ?? [];
        if (!values || values.length === 0) {
          passed = false;
          message = 'no array elements found';
        } else {
          const results = values.map((v) => evaluate(rule.operator, v, rule.expected));
          passed = results.some((r) => r.passed);
          message = passed ? null : `no element matched (checked ${values.length})`;
        }
      } else {
        actual = readPath(device, rule.jsonPath);
        ({ passed, message } = evaluate(rule.operator, actual, rule.expected));
      }

      let row = await this.resultsRepo.findOne({
        where: { deviceId, ruleKey: rule.key },
      });
      if (!row) {
        row = new ComplianceResult();
        row.id = uuidv4();
        row.deviceId = deviceId;
        row.ruleKey = rule.key;
      }
      row.passed = passed;
      row.severity = rule.severity as ComplianceSeverity;
      row.actual = actual === undefined ? null : actual;
      row.message = message;
      row.evaluatedAt = now;
      await this.resultsRepo.save(row);
      out.push(row);
    }

    return out;
  }

  async resultsForDevice(deviceId: string) {
    return this.resultsRepo.find({
      where: { deviceId },
      relations: ['rule'],
      order: { severity: 'ASC', ruleKey: 'ASC' },
    });
  }

  async summary() {
    const [totalDevices, rows] = await Promise.all([
      this.devicesRepo.count(),
      this.resultsRepo
        .createQueryBuilder('r')
        .select('r.severity', 'severity')
        .addSelect('COUNT(*) FILTER (WHERE r.passed = false)', 'failing')
        .addSelect('COUNT(DISTINCT r."deviceId") FILTER (WHERE r.passed = false)', 'devices')
        .groupBy('r.severity')
        .getRawMany(),
    ]);

    const bySeverity: Record<string, { failing: number; devices: number }> = {};
    for (const row of rows) {
      bySeverity[row.severity] = {
        failing: Number(row.failing) || 0,
        devices: Number(row.devices) || 0,
      };
    }

    const compliantDevicesRow = await this.resultsRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r."deviceId")', 'count')
      .where(
        `r."deviceId" NOT IN (
          SELECT DISTINCT "deviceId" FROM compliance_result WHERE passed = false
        )`,
      )
      .getRawOne();

    const compliantDevices = Number(compliantDevicesRow?.count) || 0;

    return {
      totalDevices,
      compliantDevices,
      compliancePct:
        totalDevices > 0
          ? Math.round((compliantDevices / totalDevices) * 100)
          : 0,
      bySeverity,
    };
  }
}
