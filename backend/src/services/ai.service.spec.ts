type CreateCallArgs = { messages: { content: string }[] };
type CreateFn = (
  args: CreateCallArgs,
) => Promise<{ choices: { message: { content: string } }[] }>;

const mockCreate = jest.fn() as jest.MockedFunction<CreateFn>;

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

import { AiService } from './ai.service';
import { AiSettingsService } from './aiSettings.service';

describe('AiService', () => {
  let service: AiService;
  let settings: jest.Mocked<Pick<AiSettingsService, 'resolveModel'>>;

  beforeEach(() => {
    mockCreate.mockReset();
    settings = { resolveModel: jest.fn().mockResolvedValue('gpt-6-astra') };
    service = new AiService(settings as unknown as AiSettingsService);
  });

  const respondWith = (content: string) =>
    mockCreate.mockResolvedValue({ choices: [{ message: { content } }] });

  describe('assistTicket', () => {
    it('returns the parsed JSON from a well-formed model response', async () => {
      respondWith(
        JSON.stringify({
          title: 'Printer offline',
          improvedDescription: 'The office printer is not responding.',
          solutions: ['Restart the printer', 'Check the network cable'],
        }),
      );

      const result = await service.assistTicket(
        'printer not working',
        'hardware',
        'HP LaserJet',
      );

      expect(result).toEqual({
        title: 'Printer offline',
        improvedDescription: 'The office printer is not responding.',
        solutions: ['Restart the printer', 'Check the network cable'],
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content).toContain('printer not working');
      expect(call.messages[0].content).toContain('hardware');
      expect(call.messages[0].content).toContain('HP LaserJet');
    });

    it('falls back to the original description when the model response is not valid JSON', async () => {
      respondWith('sorry, I cannot help with that');

      const result = await service.assistTicket('printer not working');

      expect(result).toEqual({
        title: 'Could not generate title',
        improvedDescription: 'printer not working',
        solutions: [],
      });
    });
  });

  describe('analyzeLogs', () => {
    it('returns the parsed JSON from a well-formed model response', async () => {
      respondWith(
        JSON.stringify({
          summary: 'Disk errors detected',
          issues: ['Disk I/O failure at 03:00'],
          recommendations: ['Run chkdsk', 'Replace the drive'],
        }),
      );

      const result = await service.analyzeLogs({ events: ['disk error'] });

      expect(result).toEqual({
        summary: 'Disk errors detected',
        issues: ['Disk I/O failure at 03:00'],
        recommendations: ['Run chkdsk', 'Replace the drive'],
      });
    });

    it('accepts a preformatted string instead of a JSON object', async () => {
      respondWith(
        JSON.stringify({ summary: 'ok', issues: [], recommendations: [] }),
      );

      await service.analyzeLogs('raw log text', 'ticket description');

      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content).toContain('raw log text');
      expect(call.messages[0].content).toContain('ticket description');
    });

    it('falls back gracefully when the model response is not valid JSON', async () => {
      respondWith('not json');

      const result = await service.analyzeLogs({ events: [] });

      expect(result).toEqual({
        summary: 'Log analysis failed',
        issues: [],
        recommendations: [],
      });
    });
  });

  describe('summarizeTicketClosure', () => {
    it('returns the parsed JSON from a well-formed model response', async () => {
      respondWith(
        JSON.stringify({
          title: 'VPN disconnects fixed by service restart',
          content: 'Restarting the VPN service resolved repeated drops.',
        }),
      );

      const result = await service.summarizeTicketClosure(
        {
          description: 'VPN drops every 10 minutes',
          category: 'Network',
          closureCode: 'Solved Permanently',
          closureNotes: 'Restarted service',
        },
        [
          { content: 'VPN drops every 10 minutes', type: 'Public' },
          {
            content: 'Restarted the VPN service, issue gone',
            type: 'Worknote',
          },
        ],
      );

      expect(result).toEqual({
        title: 'VPN disconnects fixed by service restart',
        content: 'Restarting the VPN service resolved repeated drops.',
      });
      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content).toContain('VPN drops every 10 minutes');
      expect(call.messages[0].content).toContain('Network');
      expect(call.messages[0].content).toContain('Solved Permanently');
      expect(call.messages[0].content).toContain('Restarted service');
      expect(call.messages[0].content).toContain(
        '[Worknote] Restarted the VPN service, issue gone',
      );
    });

    it('skips comments with empty content when building the prompt', async () => {
      respondWith(JSON.stringify({ title: 'T', content: 'C' }));

      await service.summarizeTicketClosure({ description: 'desc' }, [
        { content: '', type: 'Public' },
        { content: '   ', type: 'Worknote' },
      ]);

      const call = mockCreate.mock.calls[0][0];
      expect(call.messages[0].content).toContain('(no comments recorded)');
    });

    it('throws instead of returning a placeholder when the model response is not valid JSON', async () => {
      respondWith('sorry, I cannot help with that');

      await expect(
        service.summarizeTicketClosure({ description: 'desc' }, []),
      ).rejects.toThrow();
    });

    it('throws when the parsed response is missing title or content', async () => {
      respondWith(JSON.stringify({ title: '', content: 'C' }));

      await expect(
        service.summarizeTicketClosure({ description: 'desc' }, []),
      ).rejects.toThrow('AI response missing title or content');
    });
  });
});
