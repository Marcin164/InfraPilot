import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsController } from 'src/controllers/forms.controller';
import { Forms } from 'src/entities/forms.entity';
import { Users } from 'src/entities/users.entity';
import { FormsService } from 'src/services/forms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Forms, Users])],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
