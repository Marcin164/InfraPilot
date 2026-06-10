import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FormsService } from './forms.service';
import { Forms } from 'src/entities/forms.entity';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(false),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
  };
});

import * as fs from 'fs';
const fsMock = fs as jest.Mocked<typeof fs>;

describe('FormsService', () => {
  let service: FormsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fsMock.existsSync as jest.Mock).mockReturnValue(false);
    (fsMock.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fsMock.unlinkSync as jest.Mock).mockImplementation(() => undefined);

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (f: any) => f),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: getRepositoryToken(Forms), useValue: repo },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  describe('findAll', () => {
    it('returns all forms', async () => {
      const forms = [{ id: 'f-1' }] as Forms[];
      repo.find.mockResolvedValue(forms);
      const result = await service.findAll();
      expect(result).toBe(forms);
    });
  });

  describe('findByUser', () => {
    it('returns forms for a given user', async () => {
      const forms = [{ id: 'f-1', userId: 'user-1' }] as Forms[];
      repo.find.mockResolvedValue(forms);
      const result = await service.findByUser('user-1');
      expect(result).toBe(forms);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when form not found', async () => {
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns form when found', async () => {
      const form = { id: 'f-1' } as Forms;
      repo.findOne.mockResolvedValue(form);
      const result = await service.findOne('f-1');
      expect(result).toBe(form);
    });
  });

  describe('create', () => {
    it('throws BadRequestException when file is missing', async () => {
      await expect(service.create(null, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when userId is missing', async () => {
      const file = { originalname: 'doc.pdf', mimetype: 'application/pdf', buffer: Buffer.from(''), size: 0 };
      await expect(service.create(file, '')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for disallowed mime type', async () => {
      const file = { originalname: 'img.png', mimetype: 'image/png', buffer: Buffer.from(''), size: 0 };
      await expect(service.create(file, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('creates form record for valid PDF', async () => {
      const file = { originalname: 'form.pdf', mimetype: 'application/pdf', buffer: Buffer.from('pdf'), size: 3 };
      const saved = { id: 'f-new', userId: 'user-1', name: 'form.pdf' };
      repo.save.mockResolvedValue(saved);
      const result = await service.create(file, 'user-1');
      expect(fsMock.writeFileSync).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result).toBe(saved);
    });

    it('creates form record for valid DOCX', async () => {
      const file = {
        originalname: 'doc.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('docx'),
        size: 4,
      };
      await service.create(file, 'user-1');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when form not found', async () => {
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('deletes file and db record when file exists', async () => {
      const form = { id: 'f-1', url: '/uploads/forms/f-1.pdf' } as Forms;
      repo.findOne.mockResolvedValue(form);
      (fsMock.existsSync as jest.Mock).mockReturnValue(true);
      const result = await service.delete('f-1');
      expect(fsMock.unlinkSync).toHaveBeenCalledWith('/uploads/forms/f-1.pdf');
      expect(repo.delete).toHaveBeenCalledWith('f-1');
      expect(result).toEqual({ success: true });
    });

    it('skips unlinkSync when file does not exist on disk', async () => {
      const form = { id: 'f-1', url: '/uploads/forms/gone.pdf' } as Forms;
      repo.findOne.mockResolvedValue(form);
      (fsMock.existsSync as jest.Mock).mockReturnValue(false);
      await service.delete('f-1');
      expect(fsMock.unlinkSync).not.toHaveBeenCalled();
      expect(repo.delete).toHaveBeenCalled();
    });
  });
});
