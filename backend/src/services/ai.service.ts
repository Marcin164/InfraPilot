import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-4-8';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async assistTicket(
    description: string,
    category?: string,
    deviceInfo?: string,
  ): Promise<{ title: string; improvedDescription: string; solutions: string[] }> {
    const stream = await this.client.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: `You are an IT helpdesk AI assistant. Analyze the following support ticket and provide structured assistance.

Ticket description: ${description}
${category ? `Category: ${category}` : ''}
${deviceInfo ? `Device info: ${deviceInfo}` : ''}

Re1spond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "title": "concise ticket title (max 80 chars)",
  "improvedDescription": "clearer rewrite of the problem description",
  "solutions": ["step-by-step solution 1", "solution 2", "solution 3"]
}`,
        },
      ],
    });

    const msg = await stream.finalMessage();
    const text = msg.content.find((b) => b.type === 'text')?.text ?? '{}';

    try {
      return JSON.parse(text);
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
  ): Promise<{ summary: string; issues: string[]; recommendations: string[] }> {
    const logsText =
      typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2);

    const stream = await this.client.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: `You are an IT helpdesk AI assistant. Analyze the following Windows event logs collected from a device and identify problems.

${description ? `Ticket description: ${description}\n` : ''}Event logs:
${logsText.slice(0, 8000)}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "summary": "brief summary of log analysis",
  "issues": ["identified issue 1", "issue 2"],
  "recommendations": ["recommended action 1", "action 2"]
}`,
        },
      ],
    });

    const msg = await stream.finalMessage();
    const text = msg.content.find((b) => b.type === 'text')?.text ?? '{}';

    try {
      return JSON.parse(text);
    } catch {
      return {
        summary: 'Log analysis failed',
        issues: [],
        recommendations: [],
      };
    }
  }
}
