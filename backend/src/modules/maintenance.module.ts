import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from 'src/entities/maintenance.entity';
import { MaintenanceService } from 'src/services/maintenance.service';
import { MaintenanceController } from 'src/controllers/maintenance.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance]), AuditModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
