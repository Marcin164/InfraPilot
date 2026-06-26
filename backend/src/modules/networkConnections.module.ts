import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkConnection } from 'src/entities/networkConnection.entity';
import { Devices } from 'src/entities/devices.entity';
import { NetworkConnectionsService } from 'src/services/networkConnections.service';
import { NetworkConnectionsController } from 'src/controllers/networkConnections.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([NetworkConnection, Devices]), AuditModule],
  controllers: [NetworkConnectionsController],
  providers: [NetworkConnectionsService],
  exports: [NetworkConnectionsService],
})
export class NetworkConnectionsModule {}
