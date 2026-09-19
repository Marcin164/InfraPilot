import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  KnowledgeArticleService,
  CreateArticleDto,
  UpdateArticleDto,
} from 'src/services/knowledgeArticle.service';

@UseGuards(AuthGuard)
@Controller('knowledge/articles')
export class KnowledgeArticleController {
  constructor(private readonly service: KnowledgeArticleService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    return this.service.search(query || '');
  }

  @Get('space/:spaceId')
  async findBySpace(
    @Param('spaceId') spaceId: string,
    @Query('category') category?: string,
  ) {
    return this.service.findBySpace(spaceId, category || undefined);
  }

  @Get('space/:spaceId/categories')
  async listCategories(@Param('spaceId') spaceId: string) {
    return this.service.listCategoriesBySpace(spaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequiresPermission('knowledge.manage')
  @Post()
  async create(@Body() dto: CreateArticleDto, @Req() req: any) {
    const userId = req?.user?.properties?.metadata?.id;
    return this.service.create(dto, userId);
  }

  @RequiresPermission('knowledge.manage')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.service.update(id, dto);
  }

  @RequiresPermission('knowledge.manage')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
