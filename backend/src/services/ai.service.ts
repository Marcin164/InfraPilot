import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AiSettingsService } from './aiSettings.service';

export interface TicketAssistResult {
  title: string;
  improvedDescription: string;
  solutions: string[];
}

export interface LogAnalysisResult {
  summary: string;
  issues: string[];
  recommendations: string[];
}

export interface TicketClosureSummary {
  title: string;
  content: string;
}

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private readonly settings: AiSettingsService) {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async assistTicket(
    description: string,
    category?: string,
    deviceInfo?: string,
  ): Promise<TicketAssistResult> {
    const completion = await this.client.chat.completions.create({
      model: await this.settings.resolveModel(),
      max_completion_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an IT helpdesk AI assistant. Analyze the following support ticket and provide structured assistance.

Ticket description: ${description}
${category ? `Category: ${category}` : ''}
${deviceInfo ? `Device info: ${deviceInfo}` : ''}

Provide a concise ticket title (max 80 chars), a clearer rewrite of the problem description, and a step-by-step list of candidate solutions.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ticket_assist',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              improvedDescription: { type: 'string' },
              solutions: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'improvedDescription', 'solutions'],
            additionalProperties: false,
          },
        },
      },
    });

    const text = completion.choices[0]?.message?.content ?? '{}';

    try {
      return JSON.parse(text) as TicketAssistResult;
    } catch {
      return {
        title: 'Could not generate title',
        improvedDescription: description,
        solutions: [],
      };
    }
  }

  async analyzeLogs(
    logs: any,
    description?: string,
  ): Promise<LogAnalysisResult> {
    const logsText =
      typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2);

    const completion = await this.client.chat.completions.create({
      model: await this.settings.resolveModel(),
      max_completion_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an IT helpdesk AI assistant. Analyze the following Windows event logs collected from a device and identify problems.

${description ? `Ticket description: ${description}\n` : ''}Event logs:
${logsText.slice(0, 8000)}

Provide a brief summary of the analysis, a list of identified issues, and a list of recommended actions.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'log_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'issues', 'recommendations'],
            additionalProperties: false,
          },
        },
      },
    });

    const text = completion.choices[0]?.message?.content ?? '{}';

    try {
      return JSON.parse(text) as LogAnalysisResult;
    } catch {
      return {
        summary: 'Log analysis failed',
        issues: [],
        recommendations: [],
      };
    }
  }

  /**
   * Used by TicketWorkflowService's `ai_summarize_to_kb` step (runs on the
   * `on_close` trigger). Unlike assistTicket/analyzeLogs above, a parse
   * failure here throws instead of returning a placeholder: this result
   * gets written as a (draft) row in the knowledge base, and a low-quality
   * auto-generated placeholder article is worse than none. The workflow
   * engine already treats a thrown step error as a normal failure -- logged,
   * audited, and an ops alert dispatched -- so no article gets created.
   */
  async summarizeTicketClosure(
    ticket: {
      description: string;
      category?: string;
      closureCode?: string;
      closureNotes?: string;
    },
    comments: { content: string; type: string }[],
  ): Promise<TicketClosureSummary> {
    const commentsText = comments
      .filter((c) => c.content?.trim())
      .map((c) => `[${c.type}] ${c.content}`)
      .join('\n\n')
      .slice(0, 8000);

    const completion = await this.client.chat.completions.create({
      model: await this.settings.resolveModel(),
      max_completion_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an IT helpdesk AI assistant. A support ticket has just been closed. Write a knowledge base article capturing how this issue was resolved, so it can help solve similar problems in the future.

Ticket description: ${ticket.description}
${ticket.category ? `Category: ${ticket.category}` : ''}
${ticket.closureCode ? `Closure code: ${ticket.closureCode}` : ''}
${ticket.closureNotes ? `Closure notes: ${ticket.closureNotes}` : ''}

Conversation and work notes:
${commentsText || '(no comments recorded)'}

Provide a concise, descriptive article title, and article content written as a clear problem/solution writeup (what the issue was, how it was diagnosed, and the steps that resolved it) suitable for other agents to follow later.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ticket_closure_summary',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['title', 'content'],
            additionalProperties: false,
          },
        },
      },
    });

    const text = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text) as TicketClosureSummary;
    if (!parsed.title || !parsed.content) {
      throw new Error('AI response missing title or content');
    }
    return parsed;
  }
}
