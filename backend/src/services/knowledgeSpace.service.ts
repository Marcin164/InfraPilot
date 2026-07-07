import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { KnowledgeSpace } from 'src/entities/knowledgeSpace.entity';
import { invalidateReportCache } from 'src/helpers/reportCache';

export class CreateSpaceDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  icon?: string;
}

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) {}

@Injectable()
export class KnowledgeSpaceService {
  constructor(
    @InjectRepository(KnowledgeSpace)
    private readonly repo: Repository<KnowledgeSpace>,
  ) {}

  async findAll() {
    return this.repo.find({
      relations: ['author'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const space = await this.repo.findOne({
      where: { id },
      relations: ['author', 'articles', 'articles.author'],
    });
    if (!space) throw new NotFoundException('Space not found');
    return space;
  }

  async create(dto: CreateSpaceDto, userId?: string) {
    const space = this.repo.create({
      ...dto,
      authorId: userId,
    });
    const saved = await this.repo.save(space);
    invalidateReportCache('knowledge-by-space');
    return saved;
  }

  async update(id: string, dto: UpdateSpaceDto) {
    const space = await this.repo.findOneBy({ id });
    if (!space) throw new NotFoundException('Space not found');
    Object.assign(space, dto);
    const saved = await this.repo.save(space);
    invalidateReportCache('knowledge-by-space');
    return saved;
  }

  async remove(id: string) {
    const space = await this.repo.findOneBy({ id });
    if (!space) throw new NotFoundException('Space not found');
    await this.repo.remove(space);
    invalidateReportCache('knowledge-by-space');
    return { deleted: true };
  }
}
