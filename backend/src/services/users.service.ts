import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { validateSod } from 'src/config/sod';
import {
  createUser as createPropelAuthUser,
  fetchUserMetadataByEmail,
  fetchUserMetadataByUserId,
  logoutAllUserSessions,
} from 'src/helpers/propelAuthClient';
import { randomBytes } from 'crypto';

const ROLE_FIELDS = [
  'isAdmin',
  'isApprover',
  'isAuditor',
  'isCompliance',
  'isHelpdesk',
  'isDpo',
] as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async insertOne(user: any): Promise<any> {
    const id = user.id ?? uuidv4();
    const result = await this.usersRepository.insert({
      id,
      distinguishedName: `${user.name} ${user.surname}`,
      ...user,
    });
    // Best-effort auto-link to a matching PropelAuth account by email.
    if (user.email && !user.authUserId) {
      this.linkAuthByEmail(id).catch((err) =>
        this.logger.warn(
          `Auto-link after insertOne failed for ${id}: ${err?.message ?? err}`,
        ),
      );
    }
    return result;
  }

  async insertMany(users: any): Promise<any> {
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('Brak danych użytkowników do wstawienia.');
    }

    const mappedUsers = users.map((user) => {
      return {
        id: uuidv4(),
        distinguishedName: `${user.name} ${user.surname}`,
        ...user,
      };
    });

    return await this.usersRepository.insert(mappedUsers);
  }

  async bulkImport(
    rows: any[],
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.name && !row.email) {
          errors.push(`Row ${i + 1}: name or email required`);
          skipped++;
          continue;
        }
        const existing = row.email
          ? await this.usersRepository.findOneBy({ email: row.email })
          : null;
        if (existing) {
          errors.push(`Row ${i + 1}: user with email ${row.email} already exists — skipped`);
          skipped++;
          continue;
        }
        await this.usersRepository.insert({
          id: uuidv4(),
          distinguishedName: [row.name, row.surname].filter(Boolean).join(' ') || row.email,
          name: row.name ?? null,
          surname: row.surname ?? null,
          email: row.email ?? null,
          phone: row.phone ?? null,
          department: row.department ?? null,
          title: row.title ?? null,
        });
        created++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
        skipped++;
      }
    }

    return { created, skipped, errors };
  }

  async update(dto: any, id: string): Promise<any> {
    const existing = await this.usersRepository.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const merged = { ...existing, ...dto };
    const conflicts = validateSod(merged);
    if (conflicts.length > 0) {
      throw new BadRequestException({
        message: 'Role assignment violates segregation of duties',
        conflicts,
      });
    }

    const user = await this.usersRepository.preload({ id, ...dto });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const saved = await this.usersRepository.save(user);

    const roleChanged = ROLE_FIELDS.some(
      (f) => Boolean(existing[f]) !== Boolean(saved[f]),
    );

    if (roleChanged && existing.authUserId) {
      try {
        await logoutAllUserSessions(existing.authUserId);
        this.logger.log(
          `Forced logout of all sessions for user ${id} (authUserId=${existing.authUserId}) after role change`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to logout sessions for user ${id}: ${(err as Error).message}`,
        );
      }
    }

    return saved;
  }

  async delete(id: string): Promise<any> {
    console.log(id);
    return await this.usersRepository.delete({ id });
  }

  async insertManyUsersAD(usersData: Partial<Users>[]): Promise<any> {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      throw new Error('Brak danych użytkowników do wstawienia.');
    }

    const parseAdDate = (value: any): Date | null => {
      if (!value) return null;
      const str = String(value);
      // AD FILETIME format (ticks since 1601)
      if (/^\d{17,}$/.test(str)) {
        const ms = Number(BigInt(str) / 10000n) - 11644473600000;
        return ms > 0 ? new Date(ms) : null;
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };

    const users: any = usersData
      .filter((user: any) => user.givenName)
      .map((user: any) => ({
        name: user.givenName,
        surname: user.sn,
        email: user.userPrincipalName,
        username: user.sAMAccountName,
        distinguishedName: user.distinguishedName,
        userAccountControl: user.userAccountControl
          ? String(user.userAccountControl)
          : null,
        phone: user.telephoneNumber,
        title: user.title,
        department: user.department,
        company: user.company,
        office: user.physicalDeliveryOfficeName || user.office,
        streetAddress: user.streetAddress,
        city: user.l,
        postalCode: user.postalCode,
        country: user.co,
        manager: user.manager,
        memberOf: user.memberOf || null,
        whenCreated: parseAdDate(user.whenCreated),
        pwdLastSet: parseAdDate(user.pwdLastSet),
      }));

    let created = 0;
    let updated = 0;
    const linkCandidates: string[] = [];

    for (const user of users) {
      const existing = user.distinguishedName
        ? await this.usersRepository.findOneBy({
            distinguishedName: user.distinguishedName,
          })
        : null;

      if (existing) {
        await this.usersRepository.update(existing.id, user);
        updated++;
        // If still missing auth link, queue a re-attempt.
        if (!existing.authUserId && user.email) {
          linkCandidates.push(existing.id);
        }
      } else {
        const id = uuidv4();
        await this.usersRepository.insert({ id, ...user });
        created++;
        if (user.email) linkCandidates.push(id);
      }
    }

    // Background-link in parallel; never block the AD sync response on it.
    Promise.allSettled(
      linkCandidates.map((id) => this.linkAuthByEmail(id)),
    ).catch(() => undefined);

    return { created, updated, total: users.length };
  }

  // async syncUsersFromAD(adUsers: any[]): Promise<void> {
  //   for (const user of adUsers) {
  //     const email = user.userPrincipalName || user.mail;

  //     if (!email) {
  //       console.log(`Pomijam użytkownika bez emaila: ${user.sAMAccountName}`);
  //       continue;
  //     }

  //     // 🔍 sprawdzenie duplikatu
  //     const existing = await propelAuth.fetchUserMetadatassssssssssssByEmail(email);
  //     if (existing) {
  //       console.log(`Użytkownik ${email} już istnieje w PropelAuth`);
  //       continue;
  //     }

  //     try {
  //       await propelAuth.createUser({
  //         email,
  //         password: '1234567890',
  //         firstName: user.givenName ?? '',
  //         lastName: user.sn ?? '',
  //         emailConfirmed: true,
  //       });

  //       console.log(`Utworzono użytkownika w PropelAuth: ${email}`);
  //     } catch (err) {
  //       console.error(`Błąd synchronizacji użytkownika ${email}`, err);
  //     }
  //   }
  // }

  async findAllTable(query: any = {}): Promise<any> {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(query.limit, 10) || 30, 1);
    const search: string | undefined = query.search?.toString().trim();

    const FILTER_FIELDS = [
      'department',
      'company',
      'office',
      'city',
      'country',
      'title',
      'streetAddress',
      'postalCode',
      'manager',
    ];

    const applyFilters = (qb: any) => {
      if (search) {
        qb.andWhere(
          `(users.name ILIKE :search
            OR users.surname ILIKE :search
            OR users.username ILIKE :search
            OR users.email ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      for (const field of FILTER_FIELDS) {
        const value = query[field];
        if (!value) continue;
        const arr = Array.isArray(value) ? value : [value];
        if (arr.length === 0) continue;
        qb.andWhere(`users.${field} IN (:...${field})`, { [field]: arr });
      }
    };

    const dataQb = this.usersRepository
      .createQueryBuilder('users')
      .leftJoin('devices', 'devices', 'users.id = devices.userId')
      .select([
        'users.id AS id',
        'users.name AS name',
        'users.surname AS surname',
        'users.username AS username',
        'users.email AS email',
        'MIN(devices.assetName) AS assetName',
        'MIN(devices.model) AS model',
        'MIN(devices.id) AS deviceId',
        'users.department AS department',
        'users.office AS office',
        'users.country AS country',
        'users.city AS city',
        'users.company AS company',
        'users.title AS title',
        'users.streetAddress AS street',
        'users.postalCode AS postalCode',
        'users.manager AS manager',
        'users.isAdmin AS "isAdmin"',
        'users.isApprover AS "isApprover"',
        'users.isAuditor AS "isAuditor"',
        'users.isCompliance AS "isCompliance"',
        'users.isHelpdesk AS "isHelpdesk"',
        'users.isDpo AS "isDpo"',
      ])
      .groupBy('users.id')
      .addGroupBy('users.name')
      .addGroupBy('users.surname')
      .addGroupBy('users.username')
      .addGroupBy('users.email')
      .addGroupBy('users.department')
      .addGroupBy('users.office')
      .addGroupBy('users.country')
      .addGroupBy('users.city')
      .addGroupBy('users.company')
      .addGroupBy('users.title')
      .addGroupBy('users.streetAddress')
      .addGroupBy('users.postalCode')
      .addGroupBy('users.manager')
      .addGroupBy('users.isAdmin')
      .addGroupBy('users.isApprover')
      .addGroupBy('users.isAuditor')
      .addGroupBy('users.isCompliance')
      .addGroupBy('users.isHelpdesk')
      .addGroupBy('users.isDpo')
      .orderBy('users.surname', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit);

    applyFilters(dataQb);

    const countQb = this.usersRepository
      .createQueryBuilder('users')
      .select('COUNT(DISTINCT users.id)', 'count');

    applyFilters(countQb);

    const [data, countRow] = await Promise.all([
      dataQb.getRawMany(),
      countQb.getRawOne(),
    ]);

    const total = parseInt(countRow?.count, 10) || 0;

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUser(id: any): Promise<any> {
    return this.usersRepository.findOneBy({ id: id });
  }

  async getFilterOptions() {
    const filterFields = [
      'department',
      'company',
      'office',
      'city',
      'country',
      'title',
      'streetAddress',
      'postalCode',
      'manager',
      // 'enabled',
      // 'model',
      // 'assetName',
    ];

    const options: Record<string, string[]> = {};

    for (const field of filterFields) {
      const values = await this.usersRepository
        .createQueryBuilder('users')
        .select(`DISTINCT users.${field}`, 'value')
        .where(`users.${field} IS NOT NULL AND users.${field} != ''`)
        .orderBy('value', 'ASC')
        .getRawMany();

      options[field] = values.map((v) => v.value);
    }

    return options;
  }

  async resolveAuthIdToUserId(authId: string): Promise<any> {
    const user = await this.usersRepository.findOneBy({ authUserId: authId });
    return user;
  }

  async findApprovers(): Promise<any> {
    const approvers = await this.usersRepository.findBy({ isApprover: true });
    return approvers;
  }

  // ─── PropelAuth linking ──────────────────────────────────────────────

  /**
   * Link an app user to an existing PropelAuth account by email match.
   * Returns `{ linked: boolean, authUserId, reason }` so the UI can decide
   * what to do next (offer provisioning, prompt for manual ID, etc.).
   */
  async linkAuthByEmail(userId: string): Promise<{
    linked: boolean;
    authUserId: string | null;
    reason?: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!user.email) {
      return { linked: false, authUserId: null, reason: 'no email on user' };
    }
    if (user.authUserId) {
      return {
        linked: true,
        authUserId: user.authUserId,
        reason: 'already linked',
      };
    }

    try {
      const auth = await fetchUserMetadataByEmail(user.email, false);
      if (!auth?.userId) {
        return {
          linked: false,
          authUserId: null,
          reason: 'no PropelAuth user with this email',
        };
      }
      user.authUserId = auth.userId;
      await this.usersRepository.save(user);
      this.logger.log(
        `Linked user ${userId} to PropelAuth ${auth.userId} via email match`,
      );
      return { linked: true, authUserId: auth.userId };
    } catch (err) {
      this.logger.warn(
        `linkAuthByEmail failed for ${userId}: ${(err as Error).message}`,
      );
      return {
        linked: false,
        authUserId: null,
        reason: (err as Error).message,
      };
    }
  }

  /**
   * Create a brand-new user in PropelAuth from this app user. Sets a
   * random password — admin should follow up with PropelAuth's "send
   * reset" flow. Returns the new authUserId on success.
   */
  async provisionInAuth(userId: string): Promise<{
    authUserId: string | null;
    created: boolean;
    reason?: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!user.email) {
      throw new BadRequestException(
        'User has no email — cannot create PropelAuth account',
      );
    }
    if (user.authUserId) {
      return {
        authUserId: user.authUserId,
        created: false,
        reason: 'already linked',
      };
    }

    // Try linking first — maybe the auth account already exists.
    const linkResult = await this.linkAuthByEmail(userId);
    if (linkResult.linked) {
      return {
        authUserId: linkResult.authUserId,
        created: false,
        reason: 'matched existing PropelAuth user',
      };
    }

    const tempPassword = randomBytes(24).toString('base64');
    try {
      const created = await createPropelAuthUser({
        email: user.email,
        password: tempPassword,
        firstName: user.name ?? undefined,
        lastName: user.surname ?? undefined,
        username: user.username ?? undefined,
        emailConfirmed: true,
      } as any);
      user.authUserId = created.userId;
      await this.usersRepository.save(user);
      this.logger.log(
        `Provisioned PropelAuth user ${created.userId} for app user ${userId}`,
      );
      return { authUserId: created.userId, created: true };
    } catch (err) {
      this.logger.warn(
        `provisionInAuth failed for ${userId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  /**
   * Verify an `authUserId` exists in PropelAuth. Used by the UI to show a
   * "broken link" badge when an admin pasted a bad ID or the PropelAuth
   * user was deleted.
   */
  async verifyAuthLink(userId: string): Promise<{
    valid: boolean;
    authUserId: string | null;
    email?: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!user.authUserId) {
      return { valid: false, authUserId: null };
    }
    try {
      const auth = await fetchUserMetadataByUserId(user.authUserId, false);
      return {
        valid: Boolean(auth?.userId),
        authUserId: user.authUserId,
        email: auth?.email,
      };
    } catch {
      return { valid: false, authUserId: user.authUserId };
    }
  }
}
