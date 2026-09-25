import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { AssignmentGroupsService } from 'src/services/assignmentGroups.service';
import {
  CreateAssignmentGroupDto,
  UpdateAssignmentGroupDto,
  SetGroupMembersDto,
} from 'src/dto/assignmentGroups.dto';

@UseGuards(AuthGuard)
@Controller('assignment-groups')
export class AssignmentGroupsController {
  constructor(
    private readonly assignmentGroupsService: AssignmentGroupsService,
  ) {}

  // Needed by any ticket-handling agent to route a ticket to a group
  // (UpdateTicketForm), not just by whoever manages the groups themselves.
  @RequiresPermission('helpdesk.assignmentGroups.manage', 'helpdesk.tickets.access')
  @Get()
  async findAll() {
    return this.assignmentGroupsService.findAll();
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage', 'helpdesk.tickets.access')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assignmentGroupsService.findOne(id);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage', 'helpdesk.tickets.access')
  @Get(':id/members')
  async findMembers(@Param('id') id: string) {
    return this.assignmentGroupsService.findMembers(id);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Post()
  async create(@Body() dto: CreateAssignmentGroupDto) {
    return this.assignmentGroupsService.create(dto);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentGroupDto) {
    return this.assignmentGroupsService.update(id, dto);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.assignmentGroupsService.delete(id);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Put(':id/members')
  async setMembers(@Param('id') id: string, @Body() body: SetGroupMembersDto) {
    return this.assignmentGroupsService.setMembers(id, body?.userIds ?? []);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Post(':id/members/:userId')
  async addMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.assignmentGroupsService.addMember(id, userId);
  }

  @RequiresPermission('helpdesk.assignmentGroups.manage')
  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.assignmentGroupsService.removeMember(id, userId);
  }
}
