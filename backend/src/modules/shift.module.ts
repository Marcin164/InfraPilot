import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from 'src/entities/shift.entity';
import { ShiftsController } from 'src/controllers/shift.controller';
import { ShiftsService } from 'src/services/shifts.service';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shift]), AuditModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftModule {}