import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// ai.controller.ts pulls in AuthGuard (@UseGuards class decorator), which
// imports propelAuthClient.ts -- that module throws at import time unless
// PROPELAUTH_AUTH_URL/PROPELAUTH_API_KEY are set. Mocking the whole module
// (same technique as customRoles.controller.spec.ts) sidesteps that without
// needing real PropelAuth env vars in the test environment.
jest.mock('src/helpers/propelAuthClient', () => ({
  validateAccessTokenAndGetUserClass: jest.fn(),
}));

import {
  AiController,
  TicketAssistDto,
  AnalyzeLogsDto,
  UpdateAiSettingsDto,
} from './ai.controller';
import { AiService } from 'src/services/ai.service';
import { AiSettingsService, ALL_AI_SURFACES } from 'src/services/aiSettings.service';

// Mirrors backend/src/main.ts's global ValidationPipe exactly. If either DTO
// above loses its class-validator decorators again, every field on it stops
// being "known" to class-validator and forbidNonWhitelisted rejects the
// whole request with 400 before the controller method ever runs -- this is
// the bug this suite exists to catch (previously reproduced with a
// standalone script against the DTOs as originally written, with zero
// decorators on either class).
const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

interface MockAiService {
  assistTicket: jest.Mock;
  analyzeLogs: jest.Mock;
}

interface MockAiSettingsService {
  isSurfaceEnabled: jest.Mock;
  getConfig: jest.Mock;
  saveConfig: jest.Mock;
}

describe('AiController', () => {
  let controller: AiController;
  let aiService: MockAiService;
  let aiSettings: MockAiSettingsService;

  beforeEach(async () => {
    aiService = {
      assistTicket: jest.fn().mockResolvedValue({
        title: 'T',
        improvedDescription: 'D',
        solutions: [],
      }),
      analyzeLogs: jest.fn().mockResolvedValue({
        summary: 'S',
        issues: [],
        recommendations: [],
      }),
    };
    aiSettings = {
      isSurfaceEnabled: jest.fn().mockResolvedValue(true),
      getConfig: jest.fn().mockResolvedValue({
        model: '',
        enabledSurfaces: ALL_AI_SURFACES,
        knowledgeSpaceId: '',
      }),
      saveConfig: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiService },
        { provide: AiSettingsService, useValue: aiSettings },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  describe('ticketAssist', () => {
    it('passes the DTO fields through to AiService when the surface is enabled', async () => {
      await controller.ticketAssist({
        description: 'printer is on fire',
        category: 'hardware',
        deviceInfo: 'HP LaserJet',
        surface: 'adminTicketAssist',
      } as TicketAssistDto);

      expect(aiSettings.isSurfaceEnabled).toHaveBeenCalledWith('adminTicketAssist');
      expect(aiService.assistTicket).toHaveBeenCalledWith(
        'printer is on fire',
        'hardware',
        'HP LaserJet',
      );
    });

    it('checks the userTicketAssist surface when that is the caller', async () => {
      await controller.ticketAssist({
        description: 'printer is on fire',
        surface: 'userTicketAssist',
      } as TicketAssistDto);

      expect(aiSettings.isSurfaceEnabled).toHaveBeenCalledWith('userTicketAssist');
    });

    it('throws ForbiddenException and never calls AiService when the surface is disabled', async () => {
      aiSettings.isSurfaceEnabled.mockResolvedValue(false);

      await expect(
        controller.ticketAssist({
          description: 'printer is on fire',
          surface: 'userTicketAssist',
        } as TicketAssistDto),
      ).rejects.toThrow(ForbiddenException);
      expect(aiService.assistTicket).not.toHaveBeenCalled();
    });
  });

  describe('analyzeLogs', () => {
    it('passes the DTO fields through to AiService when logAnalysis is enabled', async () => {
      const logs = { events: ['disk error'] };
      await controller.analyzeLogs({
        logs,
        description: 'ticket description',
      } as AnalyzeLogsDto);

      expect(aiSettings.isSurfaceEnabled).toHaveBeenCalledWith('logAnalysis');
      expect(aiService.analyzeLogs).toHaveBeenCalledWith(
        logs,
        'ticket description',
      );
    });

    it('throws ForbiddenException and never calls AiService when logAnalysis is disabled', async () => {
      aiSettings.isSurfaceEnabled.mockResolvedValue(false);

      await expect(
        controller.analyzeLogs({ logs: {} } as AnalyzeLogsDto),
      ).rejects.toThrow(ForbiddenException);
      expect(aiService.analyzeLogs).not.toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('getSettings delegates to AiSettingsService.getConfig', async () => {
      const result = await controller.getSettings();
      expect(aiSettings.getConfig).toHaveBeenCalled();
      expect(result).toEqual({
        model: '',
        enabledSurfaces: ALL_AI_SURFACES,
        knowledgeSpaceId: '',
      });
    });

    it('saveSettings delegates to AiSettingsService.saveConfig with the DTO', async () => {
      const dto: UpdateAiSettingsDto = {
        model: 'gpt-5.6-luna',
        enabledSurfaces: ['adminTicketAssist'],
      };
      await controller.saveSettings(dto);
      expect(aiSettings.saveConfig).toHaveBeenCalledWith(dto);
    });
  });

  describe('DTO whitelist validation (main.ts ValidationPipe parity)', () => {
    it('keeps every TicketAssistDto field instead of stripping it as unknown', async () => {
      const instance = plainToInstance(TicketAssistDto, {
        description: 'printer is on fire',
        category: 'hardware',
        deviceInfo: 'HP LaserJet',
        surface: 'adminTicketAssist',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        description: 'printer is on fire',
        category: 'hardware',
        deviceInfo: 'HP LaserJet',
        surface: 'adminTicketAssist',
      });
    });

    it('rejects a TicketAssistDto missing the required description', async () => {
      const instance = plainToInstance(TicketAssistDto, {
        category: 'hardware',
        surface: 'adminTicketAssist',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a TicketAssistDto with a missing or invalid surface', async () => {
      const missing = plainToInstance(TicketAssistDto, {
        description: 'printer is on fire',
      });
      const invalid = plainToInstance(TicketAssistDto, {
        description: 'printer is on fire',
        surface: 'somethingElse',
      });

      expect((await validate(missing, VALIDATION_OPTIONS)).length).toBeGreaterThan(0);
      expect((await validate(invalid, VALIDATION_OPTIONS)).length).toBeGreaterThan(0);
    });

    it('keeps every AnalyzeLogsDto field instead of stripping it as unknown', async () => {
      const logs = { events: ['disk error'] };
      const instance = plainToInstance(AnalyzeLogsDto, {
        logs,
        description: 'ticket description',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors).toHaveLength(0);
      expect(instance).toEqual({ logs, description: 'ticket description' });
    });

    it('accepts a string `logs` payload on AnalyzeLogsDto, not just an object', async () => {
      const instance = plainToInstance(AnalyzeLogsDto, {
        logs: 'raw preformatted log text',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors).toHaveLength(0);
    });

    it('rejects an AnalyzeLogsDto missing the required logs field', async () => {
      const instance = plainToInstance(AnalyzeLogsDto, {
        description: 'ticket description',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('keeps every UpdateAiSettingsDto field instead of stripping it as unknown', async () => {
      const instance = plainToInstance(UpdateAiSettingsDto, {
        model: 'gpt-5.6-luna',
        enabledSurfaces: ['adminTicketAssist', 'logAnalysis'],
        knowledgeSpaceId: 'space-1',
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        model: 'gpt-5.6-luna',
        enabledSurfaces: ['adminTicketAssist', 'logAnalysis'],
        knowledgeSpaceId: 'space-1',
      });
    });

    it('rejects an UpdateAiSettingsDto with an unknown surface in the array', async () => {
      const instance = plainToInstance(UpdateAiSettingsDto, {
        enabledSurfaces: ['notARealSurface'],
      });

      const errors = await validate(instance, VALIDATION_OPTIONS);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts an empty UpdateAiSettingsDto (both fields optional)', async () => {
      const instance = plainToInstance(UpdateAiSettingsDto, {});
      const errors = await validate(instance, VALIDATION_OPTIONS);
      expect(errors).toHaveLength(0);
    });
  });
});
