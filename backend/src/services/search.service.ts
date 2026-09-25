import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { Histories } from 'src/entities/histories.entity';
import { Applications } from 'src/entities/applications.entity';
import { KnowledgeArticle } from 'src/entities/knowledgeArticle.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { PurchaseOrder } from 'src/entities/purchaseOrder.entity';

export type SearchResultItem = {
  id: string;
  type: 'user' | 'device' | 'ticket' | 'history' | 'application' | 'knowledge' | 'license' | 'procurement';
  title: string;
  subtitle?: string;
  url: string;
};

const LIMIT = 8;

/** Which view permission gates each search category. */
const CATEGORY_PERMISSION: Record<
  'users' | 'devices' | 'tickets' | 'histories' | 'applications' | 'knowledge' | 'licenses' | 'procurement',
  string
> = {
  users: 'users.view',
  devices: 'devices.view',
  tickets: 'helpdesk.tickets.access',
  histories: 'devices.view',
  applications: 'devices.view',
  knowledge: 'knowledge.view',
  licenses: 'licenses.view',
  procurement: 'procurement.view',
};

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Users) private usersRepo: Repository<Users>,
    @InjectRepository(Devices) private devicesRepo: Repository<Devices>,
    @InjectRepository(Tickets) private ticketsRepo: Repository<Tickets>,
    @InjectRepository(Histories) private historiesRepo: Repository<Histories>,
    @InjectRepository(Applications)
    private applicationsRepo: Repository<Applications>,
    @InjectRepository(KnowledgeArticle)
    private knowledgeRepo: Repository<KnowledgeArticle>,
    @InjectRepository(SoftwareLicense)
    private licenseRepo: Repository<SoftwareLicense>,
    @InjectRepository(PurchaseOrder)
    private procurementRepo: Repository<PurchaseOrder>,
  ) {}

  /**
   * Substring match inside jsonb payloads. Cheap but thorough: cast each
   * jsonb column to text and ILIKE. Only fires when the term is >= 4
   * chars — short needles would match most scans (e.g. searching "exe"
   * would hit every install).
   */
  private async searchJsonbContents(term: string): Promise<Devices[]> {
    if (term.length < 4) return [];
    const like = `%${term}%`;
    return this.devicesRepo
      .createQueryBuilder('d')
      .where('d.software::text ILIKE :like', { like })
      .orWhere('d.hardware::text ILIKE :like', { like })
      .orWhere('d.peripherals::text ILIKE :like', { like })
      .orWhere('d.network::text ILIKE :like', { like })
      .limit(LIMIT)
      .getMany();
  }

  /**
   * `granted` is the caller's effective permission set (see
   * CustomRolesService.getUserPermissions()) -- each category only runs
   * its query, and only appears in the result, when the caller holds the
   * matching CATEGORY_PERMISSION. Search spans users/devices/tickets/
   * licenses/etc, each gated differently elsewhere in the app; without
   * this, any authenticated user could read every module's data through
   * the search bar regardless of their actual role.
   */
  async searchAll(
    q: string,
    granted: ReadonlySet<string> = new Set(),
  ): Promise<{
    users: SearchResultItem[];
    devices: SearchResultItem[];
    tickets: SearchResultItem[];
    histories: SearchResultItem[];
    applications: SearchResultItem[];
    knowledge: SearchResultItem[];
    licenses: SearchResultItem[];
    procurement: SearchResultItem[];
  }> {
    const term = (q || '').trim();
    if (!term) {
      return {
        users: [],
        devices: [],
        tickets: [],
        histories: [],
        applications: [],
        knowledge: [],
        licenses: [],
        procurement: [],
      };
    }
    const like = `%${term}%`;
    const can = (category: keyof typeof CATEGORY_PERMISSION) =>
      granted.has(CATEGORY_PERMISSION[category]);

    const [
      users,
      devicesStructured,
      devicesJsonb,
      tickets,
      histories,
      applications,
      knowledgeArticles,
      licenses,
      purchaseOrders,
    ] = await Promise.all([
      can('users')
        ? this.usersRepo.find({
            where: [
              { name: ILike(like) },
              { surname: ILike(like) },
              { email: ILike(like) },
              { username: ILike(like) },
            ],
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('devices')
        ? this.devicesRepo.find({
            where: [
              { assetName: ILike(like) },
              { serialNumber: ILike(like) },
              { model: ILike(like) },
              { manufacturer: ILike(like) },
              { location: ILike(like) },
            ],
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('devices') ? this.searchJsonbContents(term) : Promise.resolve([]),
      can('tickets')
        ? this.ticketsRepo.find({
            where: [
              { description: ILike(like) },
              { category: ILike(like) },
              ...(/^\d+$/.test(term) ? [{ number: parseInt(term, 10) }] : []),
            ],
            take: LIMIT,
            order: { createdAt: 'DESC' },
          })
        : Promise.resolve([]),
      can('histories')
        ? this.historiesRepo.find({
            where: [
              { details: ILike(like) },
              { justification: ILike(like) },
              { ticket: ILike(like) },
            ],
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('applications')
        ? this.applicationsRepo
            .createQueryBuilder('a')
            .where('a.nameKey ILIKE :like', { like: `%${term.toLowerCase()}%` })
            .orWhere('a.publisherKey ILIKE :like', {
              like: `%${term.toLowerCase()}%`,
            })
            .limit(LIMIT)
            .getMany()
        : Promise.resolve([]),
      can('knowledge')
        ? this.knowledgeRepo.find({
            where: [
              { title: ILike(like) },
              { content: ILike(like) },
              { category: ILike(like) },
            ],
            take: LIMIT,
            order: { views: 'DESC' },
          })
        : Promise.resolve([]),
      can('licenses')
        ? this.licenseRepo.find({
            where: [
              { name: ILike(like) },
              { publisher: ILike(like) },
              { vendor: ILike(like) },
            ],
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('procurement')
        ? this.procurementRepo.find({
            where: [
              { title: ILike(like) },
              { supplier: ILike(like) },
            ],
            take: LIMIT,
            order: { createdAt: 'DESC' },
          })
        : Promise.resolve([]),
    ]);

    // Merge structured + jsonb hits, dedup by id, cap at LIMIT.
    const devicesMap = new Map<string, Devices>();
    for (const d of devicesStructured) devicesMap.set(d.id, d);
    for (const d of devicesJsonb) if (!devicesMap.has(d.id)) devicesMap.set(d.id, d);
    const devices = Array.from(devicesMap.values()).slice(0, LIMIT);

    return {
      users: users.map((u) => ({
        id: u.id,
        type: 'user',
        title:
          `${u.name ?? ''} ${u.surname ?? ''}`.trim() || u.username || u.email,
        subtitle: u.email || u.username,
        url: `/admin/users/${u.id}`,
      })),
      devices: devices.map((d) => ({
        id: d.id,
        type: 'device',
        title: d.assetName || d.serialNumber || d.id,
        subtitle:
          [d.manufacturer, d.model].filter(Boolean).join(' ') || d.location,
        url: `/admin/devices/${d.id}/system`,
      })),
      tickets: tickets.map((t) => ({
        id: t.id,
        type: 'ticket',
        title: `#${t.number} ${t.category ?? ''}`.trim(),
        subtitle: (t.description || '').slice(0, 80),
        url: `/admin/helpdesk/${t.id}`,
      })),
      histories: histories.map((h) => ({
        id: h.id,
        type: 'history',
        title: h.details ? h.details.slice(0, 60) : `Wpis ${h.id}`,
        subtitle: [h.date, h.ticket].filter(Boolean).join(' • '),
        url: h.deviceId
          ? `/admin/devices/${h.deviceId}/history`
          : `/admin/helpdesk`,
      })),
      applications: applications.map((a) => ({
        id: a.id,
        type: 'application' as const,
        title: a.name,
        subtitle: a.publisher ?? undefined,
        url: `/admin/reports/devices?applicationId=${a.id}`,
      })),
      knowledge: knowledgeArticles.map((a) => ({
        id: a.id,
        type: 'knowledge' as const,
        title: a.title,
        subtitle: a.category ?? undefined,
        url: `/admin/knowledge/${a.spaceId}/${a.id}`,
      })),
      licenses: licenses.map((l) => ({
        id: l.id,
        type: 'license' as const,
        title: l.name,
        subtitle: [l.publisher, l.vendor].filter(Boolean).join(' • ') || undefined,
        url: `/admin/licenses`,
      })),
      procurement: purchaseOrders.map((p) => ({
        id: p.id,
        type: 'procurement' as const,
        title: p.title,
        subtitle: p.supplier ?? undefined,
        url: `/admin/procurement`,
      })),
    };
  }
}
