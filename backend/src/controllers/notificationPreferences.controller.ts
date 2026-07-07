import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { NotificationPreferencesService } from 'src/services/notificationPreferences.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { UpdatePreferencesDto } from 'src/dto/notificationPreferences.dto';

@UseGuards(AuthGuard)
@Roles(
  Role.Admin,
  Role.Helpdesk,
  Role.Auditor,
  Role.Compliance,
  Role.Approver,
  Role.Dpo,
)
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(
    private readonly service: NotificationPreferencesService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  private actorOf(req: any): string {
    return req?.user?.properties?.metadata?.id ?? req?.user?.id ?? '';
  }

  @Get()
  list(@Req() req: any) {
    return this.service.listForUser(this.actorOf(req));
  }

  @Post()
  async update(@Req() req: any, @Body() body: UpdatePreferencesDto) {
    const written = await this.service.setMany(this.actorOf(req), body.rows ?? []);
    return { written };
  }

  @Post('test')
  async test(@Req() req: any) {
    return this.dispatcher.test(this.actorOf(req));
  }
}
