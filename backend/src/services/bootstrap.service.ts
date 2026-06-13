import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

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

    await this.usersRepo.insert({
      id: uuidv4(),
      email: adminEmail,
      isAdmin: true,
      isHelpdesk: true,
    });

    this.logger.log(`Bootstrap: first admin user created (${adminEmail})`);
  }
}
