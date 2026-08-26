import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { GithubEnterpriseService } from 'src/services/githubEnterprise.service';
import { GithubEnterpriseController } from 'src/controllers/githubEnterprise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, SoftwareLicense])],
  controllers: [GithubEnterpriseController],
  providers: [GithubEnterpriseService],
  exports: [GithubEnterpriseService],
})
export class GithubEnterpriseModule {}
