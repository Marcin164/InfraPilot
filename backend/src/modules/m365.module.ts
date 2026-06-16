import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { M365Service } from 'src/services/m365.service';
import { M365Controller } from 'src/controllers/m365.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, Users, Devices])],
  controllers: [M365Controller],
  providers: [M365Service],
  exports: [M365Service],
})
export class M365Module {}
