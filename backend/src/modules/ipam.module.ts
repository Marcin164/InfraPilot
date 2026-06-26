import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subnet } from 'src/entities/subnet.entity';
import { IpAllocation } from 'src/entities/ipAllocation.entity';
import { Devices } from 'src/entities/devices.entity';
import { IpamService } from 'src/services/ipam.service';
import { IpamController } from 'src/controllers/ipam.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subnet, IpAllocation, Devices]), AuditModule],
  controllers: [IpamController],
  providers: [IpamService],
  exports: [IpamService],
})
export class IpamModule {}
