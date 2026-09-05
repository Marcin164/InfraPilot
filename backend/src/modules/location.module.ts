import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from 'src/entities/location.entity';
import { LocationService } from 'src/services/location.service';
import { LocationController } from 'src/controllers/location.controller';
import { AuditModule } from './audit.module';
import { DevicesModule } from './devices.module';

@Module({
  imports: [TypeOrmModule.forFeature([Location]), AuditModule, DevicesModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
