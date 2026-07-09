import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { createUser as createPropelAuthUser } from 'src/helpers/propelAuthClient';
import { randomBytes } from 'crypto';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    if (!adminEmail) return;

    const count = await this.usersRepo.count();
    if (count > 0) return;

    const name = process.env.ADMIN_NAME?.trim() ?? null;
    const surname = process.env.ADMIN_SURNAME?.trim() ?? null;
    const distinguishedName =
      [name, surname].filter(Boolean).join(' ') || adminEmail;

    const id = uuidv4();

    await this.usersRepo.insert({
      id,
      email: adminEmail,
      name: name ?? undefined,
      surname: surname ?? undefined,
      distinguishedName,
      isAdmin: true,
      isHelpdesk: true,
    });

    this.logger.log(`Bootstrap: created first admin user (${adminEmail})`);

    // Provision in PropelAuth so the user can actually log in.
    try {
      const tempPassword = randomBytes(24).toString('base64');
      const created = await createPropelAuthUser({
        email: adminEmail,
        password: tempPassword,
        firstName: name ?? undefined,
        lastName: surname ?? undefined,
        emailConfirmed: true,
      } as any);

      await this.usersRepo.update(id, { authUserId: created.userId });
      this.logger.log(
        `Bootstrap: provisioned PropelAuth account ${created.userId} for ${adminEmail} — send a password-reset email to let the user set their own password`,
      );
    } catch (err) {
      this.logger.warn(
        `Bootstrap: PropelAuth provisioning failed for ${adminEmail}: ${(err as Error).message}. ` +
          `User exists in the database — run POST /users/${id}/provision-auth manually to retry.`,
      );
    }
  }
}
