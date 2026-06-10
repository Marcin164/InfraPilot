import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

// Mock helper modules
jest.mock('src/helpers/reportRegistry', () => ({
  getReportMeta: jest.fn(),
  listReports: jest.fn().mockReturnValue([]),
}));
jest.mock('src/helpers/reportCache', () => ({
  withCache: jest.fn((_key: any, _filters: any, fn: () => any) => fn()),
}));
jest.mock('src/helpers/csv', () => ({
  toCsv: jest.fn().mockReturnValue('col1,col2\nval1,val2'),
}));
jest.mock('src/helpers/pdf', () => ({
  renderReportPdf: jest.fn().mockResolvedValue({ buffer: Buffer.from('pdf'), sha256: 'abc' }),
}));

import { getReportMeta, listReports } from 'src/helpers/reportRegistry';

const mockGetReportMeta = getReportMeta as jest.Mock;
const mockListReports = listReports as jest.Mock;

const makeMeta = (overrides: any = {}) => ({
  key: 'devices',
  title: 'Devices Report',
  fn: jest.fn().mockResolvedValue([{ id: 'dev-1' }]),
  supportsFilters: ['from', 'to'],
  ...overrides,
});

describe('ReportsService', () => {
  let service: ReportsService;
  let db: jest.Mocked<any>;

  beforeEach(async () => {
    db = {};
    mockGetReportMeta.mockReset();
    mockListReports.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: DataSource, useValue: db },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('list', () => {
    it('returns reports from registry', () => {
      const reports = [makeMeta()];
      mockListReports.mockReturnValue(reports);
      const result = service.list();
      expect(result).toBe(reports);
    });
  });

  describe('generate', () => {
    it('throws NotFoundException for unknown report type', async () => {
      mockGetReportMeta.mockReturnValue(null);
      await expect(service.generate('unknown')).rejects.toThrow(NotFoundException);
    });

    it('calls report fn and returns result', async () => {
      const meta = makeMeta();
      mockGetReportMeta.mockReturnValue(meta);
      const result = await service.generate('devices');
      expect(meta.fn).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'dev-1' }]);
    });

    it('passes sanitized filters to report fn', async () => {
      const meta = makeMeta({ supportsFilters: ['from'] });
      mockGetReportMeta.mockReturnValue(meta);
      await service.generate('devices', { from: '2024-01-01', unknown: 'x' });
      const callArgs = meta.fn.mock.calls[0][0];
      expect(callArgs.filters.from).toBe('2024-01-01');
      expect(callArgs.filters.unknown).toBeUndefined();
    });
  });

  describe('generateBatch', () => {
    it('returns results for each type', async () => {
      const meta = makeMeta();
      mockGetReportMeta.mockReturnValue(meta);
      const result = await service.generateBatch(['devices']);
      expect(result['devices']).toBeDefined();
    });

    it('deduplicates types', async () => {
      const meta = makeMeta();
      mockGetReportMeta.mockReturnValue(meta);
      await service.generateBatch(['devices', 'devices']);
      expect(meta.fn).toHaveBeenCalledTimes(1);
    });

    it('returns empty array for failing report types', async () => {
      mockGetReportMeta.mockReturnValue(null); // causes NotFoundException
      const result = await service.generateBatch(['broken']);
      expect(result['broken']).toEqual([]);
    });
  });

  describe('exportCsv', () => {
    it('returns filename and csv', async () => {
      const meta = makeMeta();
      mockGetReportMeta.mockReturnValue(meta);
      const result = await service.exportCsv('devices');
      expect(result.filename).toBe('devices.csv');
      expect(typeof result.csv).toBe('string');
    });
  });

  describe('exportPdf', () => {
    it('returns filename, buffer, and sha256', async () => {
      const meta = makeMeta();
      mockGetReportMeta.mockReturnValue(meta);
      const result = await service.exportPdf('devices');
      expect(result.filename).toBe('devices.pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(typeof result.sha256).toBe('string');
    });
  });
});
