import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { SearchService } from 'src/services/search.service';
import { CustomRolesService } from 'src/services/customRoles.service';

// Global search spans several unrelated modules (users, devices, tickets,
// licenses, ...) each with their own view permission -- there's no single
// permission that's right to gate the whole endpoint behind, so instead
// every authenticated user can call it, and SearchService filters each
// category by whatever the caller actually holds (see searchAll()).
@UseGuards(AuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly customRolesService: CustomRolesService,
  ) {}

  @Get()
  async search(@Query('q') q: string, @Req() req: any) {
    const callerId: string | undefined = req?.user?.properties?.metadata?.id;
    const granted = callerId
      ? await this.customRolesService.getUserPermissions(callerId)
      : new Set<string>();
    return this.searchService.searchAll(q, granted);
  }
}
