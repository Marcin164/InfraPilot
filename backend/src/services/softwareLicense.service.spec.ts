import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SoftwareLicenseService } from './softwareLicense.service';
import { LicenseSource, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { SoftwareLicenseAssignment } from 'src/entities/softwareLicenseAssignment.entity';

describe('SoftwareLicenseService', () => {
  let service: SoftwareLicenseService;
  let licenseRepo: jest.Mocked<any>;
  let assignmentRepo: jest.Mocked<any>;

  beforeEach(async () => {
    licenseRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((v: any) => v),
      save: jest.fn().mockImplementation((l: any) => Promise.resolve(l)),
    };
    assignmentRepo = {
      createQueryBuilder: jest.fn(),
      countBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftwareLicenseService,
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
        { provide: getRepositoryToken(SoftwareLicenseAssignment), useValue: assignmentRepo },
      ],
    }).compile();

    service = module.get<SoftwareLicenseService>(SoftwareLicenseService);
  });

  describe('create', () => {
    it('always stamps manually-created licenses with source manual, regardless of input', async () => {
      const license = await service.create({ name: 'Photoshop' } as any);
      expect(license.source).toBe(LicenseSource.MANUAL);
    });
  });

  describe('findAll — usedSeats resolution', () => {
    it('counts local assignments for manual licenses', async () => {
      licenseRepo.find.mockResolvedValue([
        { id: 'l1', source: LicenseSource.MANUAL, consumedSeats: null } as SoftwareLicense,
      ]);
      assignmentRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ licenseId: 'l1', count: '3' }]),
      });

      const result = await service.findAll();
      expect(result[0].usedSeats).toBe(3);
    });

    it('uses provider-reported consumedSeats for synced licenses instead of local assignment count', async () => {
      licenseRepo.find.mockResolvedValue([
        { id: 'l2', source: LicenseSource.M365, consumedSeats: 42 } as SoftwareLicense,
      ]);
      assignmentRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        // No local assignments exist for synced licenses, but usedSeats must
        // still reflect the provider's seat consumption, not zero.
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();
      expect(result[0].usedSeats).toBe(42);
    });
  });

  describe('findOne — usedSeats resolution', () => {
    it('uses consumedSeats for a synced license', async () => {
      licenseRepo.findOneBy.mockResolvedValue({
        id: 'l3', source: LicenseSource.GITHUB, consumedSeats: 7,
      } as SoftwareLicense);
      assignmentRepo.countBy.mockResolvedValue(0);

      const result = await service.findOne('l3');
      expect(result.usedSeats).toBe(7);
    });
  });
});
