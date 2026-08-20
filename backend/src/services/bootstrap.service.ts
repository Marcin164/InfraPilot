import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { UsersService } from 'src/services/users.service';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private readonly usersService: UsersService,
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

    // Link to an existing PropelAuth account by email first — falls back to
    // creating a new one only if none exists. Same logic UsersController
    // uses for every other user, so ADMIN_EMAIL behaves consistently
    // whether or not you created that PropelAuth account beforehand.
    try {
      const result = await this.usersService.provisionInAuth(id);
      if (result.created) {
        this.logger.log(
          `Bootstrap: provisioned new PropelAuth account ${result.authUserId} for ${adminEmail} — send a password-reset email to let the user set their own password`,
        );
      } else {
        this.logger.log(
          `Bootstrap: linked existing PropelAuth account ${result.authUserId} for ${adminEmail}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Bootstrap: PropelAuth provisioning failed for ${adminEmail}: ${(err as Error).message}. ` +
          `User exists in the database — run POST /users/${id}/provision-auth manually to retry.`,
      );
    }
  }
}
