import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from 'src/entities/shift.entity';
import { Users } from 'src/entities/users.entity';
import { ShiftsController } from 'src/controllers/shift.controller';
import { ShiftsService } from 'src/services/shifts.service';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Users]), AuditModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftModule {}