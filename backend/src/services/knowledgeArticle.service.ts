import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ArticleStatus, KnowledgeArticle } from 'src/entities/knowledgeArticle.entity';
import { invalidateReportCache } from 'src/helpers/reportCache';

export class CreateArticleDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @IsString() @IsNotEmpty()
  spaceId: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsString()
  ticketId?: string;
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}

function invalidateKnowledgeReports() {
  invalidateReportCache('knowledge-most-viewed');
  invalidateReportCache('knowledge-by-status');
  invalidateReportCache('knowledge-by-space');
}

@Injectable()
export class KnowledgeArticleService {
  constructor(
    @InjectRepository(KnowledgeArticle)
    private readonly repo: Repository<KnowledgeArticle>,
  ) {}

  async findBySpace(spaceId: string, category?: string) {
    return this.repo.find({
      where: { spaceId, ...(category ? { category } : {}) },
      relations: ['author'],
      order: { updatedAt: 'DESC' },
    });
  }

  async listCategoriesBySpace(
    spaceId: string,
  ): Promise<Array<{ category: string; count: number }>> {
    const rows = await this.repo
      .createQueryBuilder('article')
      .select('article.category', 'category')
      .addSelect('COUNT(*)::int', 'count')
      .where('article.spaceId = :spaceId', { spaceId })
      .andWhere('article.category IS NOT NULL')
      .andWhere("article.category <> ''")
      .groupBy('article.category')
      .orderBy('article.category', 'ASC')
      .getRawMany();
    return rows;
  }

  async findOne(id: string) {
    const article = await this.repo.findOne({
      where: { id },
      relations: ['author', 'space'],
    });
    if (!article) throw new NotFoundException('Article not found');

    // increment views
    await this.repo.increment({ id }, 'views', 1);

    return article;
  }

  async search(query: string) {
    return this.repo.find({
      where: [
        { title: ILike(`%${query}%`) },
        { content: ILike(`%${query}%`) },
      ],
      relations: ['author', 'space'],
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  async create(dto: CreateArticleDto, userId?: string) {
    const article = this.repo.create({
      ...dto,
      authorId: userId,
    });
    const saved = await this.repo.save(article);
    invalidateKnowledgeReports();
    return saved;
  }

  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article not found');
    Object.assign(article, dto);
    const saved = await this.repo.save(article);
    invalidateKnowledgeReports();
    return saved;
  }

  async remove(id: string) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article not found');
    await this.repo.remove(article);
    invalidateKnowledgeReports();
    return { deleted: true };
  }
}
