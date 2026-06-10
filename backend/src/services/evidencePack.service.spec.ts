import { Test, TestingModule } from '@nestjs/testing';
import { EvidencePackService } from './evidencePack.service';
import { ReportsService } from './reports.service';
import { AuditService } from './audit.service';

jest.mock('src/helpers/reportRegistry', () => ({
  listReports: jest.fn().mockReturnValue([]),
}));

describe('EvidencePackService', () => {
  let service: EvidencePackService;
  let reportsService: jest.Mocked<any>;
  let auditService: jest.Mocked<any>;

  beforeEach(async () => {
    reportsService = {
      exportCsv: jest.fn().mockResolvedValue({ filename: 'report.csv', csv: 'col,val' }),
      exportPdf: jest.fn().mockResolvedValue({ filename: 'report.pdf', buffer: Buffer.from('pdf') }),
    };
    auditService = {
      exportRange: jest.fn().mockResolvedValue([{ id: 'a-1', entityType: 'User', entityId: 'u-1', action: 'created', hash: 'h', prevHash: null, data: {}, createdAt: new Date() }]),
      verifyChain: jest.fn().mockResolvedValue({ valid: true }),
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidencePackService,
        { provide: ReportsService, useValue: reportsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EvidencePackService>(EvidencePackService);
  });

  describe('build', () => {
    it('returns stream, filename, and packId', async () => {
      const result = await service.build({
        from: '2024-01-01',
        to: '2024-01-31',
        include: [],
      });
      expect(result.stream).toBeDefined();
      expect(result.filename).toMatch(/^evidence-.+\.zip$/);
      expect(typeof result.packId).toBe('string');
    });

    it('includes audit files when "audit" is in include', async () => {
      const result = await service.build({
        from: '2024-01-01',
        to: '2024-01-31',
        include: ['audit'],
      });
      expect(auditService.exportRange).toHaveBeenCalledWith(
        expect.objectContaining({ from: '2024-01-01', to: '2024-01-31' }),
      );
      expect(auditService.verifyChain).toHaveBeenCalled();
      expect(result.packId).toBeDefined();
    });

    it('includes ticket audit files when "tickets" is in include', async () => {
      await service.build({
        from: '2024-01-01',
        to: '2024-01-31',
        include: ['tickets'],
      });
      expect(auditService.exportRange).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'Ticket' }),
      );
    });

    it('logs audit event after build', async () => {
      await service.build({
        from: '2024-01-01',
        to: '2024-01-31',
        include: [],
        actor: 'admin-1',
      });
      expect(auditService.log).toHaveBeenCalledWith(
        'EvidencePack',
        expect.any(String),
        'generated',
        expect.objectContaining({ actor: 'admin-1' }),
      );
    });
  });
});
