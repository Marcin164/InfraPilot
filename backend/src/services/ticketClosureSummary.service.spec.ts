import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketClosureSummaryService } from './ticketClosureSummary.service';
import { Tickets } from 'src/entities/tickets.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { ArticleStatus } from 'src/entities/knowledgeArticle.entity';
import { AiService } from './ai.service';
import { AiSettingsService, ALL_AI_SURFACES } from './aiSettings.service';
import { KnowledgeArticleService } from './knowledgeArticle.service';
import { KnowledgeSpaceService } from './knowledgeSpace.service';
import { AuditService } from './audit.service';

const makeTicket = (overrides: any = {}): any => ({
  id: 'ticket-1',
  number: 42,
  category: 'Network',
  description: 'VPN issue',
  ...overrides,
});

describe('TicketClosureSummaryService', () => {
  let service: TicketClosureSummaryService;
  let ticketsRepo: jest.Mocked<any>;
  let commentsRepo: jest.Mocked<any>;
  let ai: jest.Mocked<any>;
  let aiSettings: jest.Mocked<any>;
  let knowledgeArticles: jest.Mocked<any>;
  let knowledgeSpaces: jest.Mocked<any>;
  let audit: jest.Mocked<any>;

  beforeEach(async () => {
    ticketsRepo = { findOneBy: jest.fn().mockResolvedValue(makeTicket()) };
    commentsRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockResolvedValue(undefined),
    };
    ai = {
      summarizeTicketClosure: jest
        .fn()
        .mockResolvedValue({ title: 'AI title', content: 'AI content' }),
    };
    aiSettings = {
      isSurfaceEnabled: jest.fn().mockResolvedValue(true),
      getConfig: jest.fn().mockResolvedValue({
        model: '',
        enabledSurfaces: ALL_AI_SURFACES,
        knowledgeSpaceId: 'space-configured',
      }),
      saveConfig: jest.fn().mockResolvedValue(undefined),
    };
    knowledgeArticles = {
      create: jest.fn().mockImplementation((dto: any) => ({
        id: 'article-1',
        ...dto,
      })),
    };
    knowledgeSpaces = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'space-auto', name: 'AI Generated' }),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketClosureSummaryService,
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: getRepositoryToken(TicketsComments), useValue: commentsRepo },
        { provide: AiService, useValue: ai },
        { provide: AiSettingsService, useValue: aiSettings },
        { provide: KnowledgeArticleService, useValue: knowledgeArticles },
        { provide: KnowledgeSpaceService, useValue: knowledgeSpaces },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<TicketClosureSummaryService>(
      TicketClosureSummaryService,
    );
  });

  it('throws ForbiddenException and does nothing when the ticketClosureSummary surface is disabled', async () => {
    aiSettings.isSurfaceEnabled.mockResolvedValue(false);

    await expect(service.documentSolution('ticket-1', 'agent-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(ai.summarizeTicketClosure).not.toHaveBeenCalled();
    expect(knowledgeArticles.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the ticket does not exist', async () => {
    ticketsRepo.findOneBy.mockResolvedValue(null);

    await expect(service.documentSolution('ghost', 'agent-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(ai.summarizeTicketClosure).not.toHaveBeenCalled();
  });

  it('creates a draft article in the configured space and leaves a worknote attributed to the acting agent', async () => {
    commentsRepo.find.mockResolvedValue([
      { content: 'VPN drops every 10 minutes', type: 'Public' },
      { content: 'Restarted the VPN service, issue gone', type: 'Worknote' },
    ]);

    const article = await service.documentSolution(
      'ticket-1',
      'agent-1',
    );

    expect(ai.summarizeTicketClosure).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'VPN issue', category: 'Network' }),
      [
        { content: 'VPN drops every 10 minutes', type: 'Public' },
        { content: 'Restarted the VPN service, issue gone', type: 'Worknote' },
      ],
    );
    expect(article).toEqual(
      expect.objectContaining({
        id: 'article-1',
        title: 'AI title',
        content: 'AI content',
        spaceId: 'space-configured',
        status: ArticleStatus.DRAFT,
        tags: ['ai-generated'],
        ticketId: 'ticket-1',
      }),
    );
    expect(commentsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Worknote',
        authorId: 'agent-1',
        content: expect.stringContaining('AI title'),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      'KnowledgeArticle',
      'article-1',
      'ai_drafted_from_ticket',
      expect.objectContaining({ ticketId: 'ticket-1', actorId: 'agent-1' }),
    );
  });

  it('auto-creates a default "AI Generated" space when none is configured, and persists it', async () => {
    aiSettings.getConfig.mockResolvedValue({
      model: '',
      enabledSurfaces: ALL_AI_SURFACES,
      knowledgeSpaceId: '',
    });
    knowledgeSpaces.findAll.mockResolvedValue([]);

    await service.documentSolution('ticket-1', 'agent-1');

    expect(knowledgeSpaces.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'AI Generated' }),
    );
    expect(aiSettings.saveConfig).toHaveBeenCalledWith({ knowledgeSpaceId: 'space-auto' });
  });

  it('lets a real AI failure propagate instead of swallowing it', async () => {
    ai.summarizeTicketClosure.mockRejectedValue(new Error('OpenAI down'));

    await expect(service.documentSolution('ticket-1', 'agent-1')).rejects.toThrow(
      'OpenAI down',
    );
    expect(knowledgeArticles.create).not.toHaveBeenCalled();
  });
});
