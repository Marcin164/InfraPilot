import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { FormsService } from 'src/services/forms.service';
import { Users } from 'src/entities/users.entity';

@UseGuards(AuthGuard)
@Controller('forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  // A regular user may only touch their own forms; admins/helpdesk (who
  // manage forms on a user's behalf from Settings > Users) can touch anyone's.
  private async assertSelfOrStaff(req: any, targetUserId: string) {
    const callerId: string | undefined = req?.user?.properties?.metadata?.id;
    if (callerId && callerId === targetUserId) return;

    const caller = callerId
      ? await this.usersRepository.findOneBy({ id: callerId })
      : null;
    if (caller?.isAdmin || caller?.isHelpdesk) return;

    throw new ForbiddenException('You may only manage your own documents');
  }

  @Get()
  async findAll(): Promise<any> {
    return this.formsService.findAll();
  }

  @Get('/user/:userId')
  async findByUser(@Param('userId') userId: string, @Req() req: any) {
    await this.assertSelfOrStaff(req, userId);
    return this.formsService.findByUser(userId);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const { form, stream } = await this.formsService.getFileStream(id);
    await this.assertSelfOrStaff(req, form.userId);
    res.setHeader('Content-Type', form.mimetype || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(form.name)}"`,
    );
    stream.pipe(res);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async create(
    @UploadedFile() file: any,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    await this.assertSelfOrStaff(req, userId);
    return this.formsService.create(file, userId);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const form = await this.formsService.findOne(id);
    await this.assertSelfOrStaff(req, form.userId);
    return this.formsService.delete(id);
  }
}
