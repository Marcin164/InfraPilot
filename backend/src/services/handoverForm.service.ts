import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { Devices } from 'src/entities/devices.entity';
import { Users } from 'src/entities/users.entity';
import { FormsService } from 'src/services/forms.service';

const HANDOVER_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type RenderResult = { buffer: Buffer; sha256: string; filename: string };
type Lang = 'pl' | 'en';

const STRINGS: Record<Lang, Record<string, string>> = {
  pl: {
    title: 'Protokół odbioru sprzętu',
    issuedOn: 'Data wystawienia',
    employeeSection: 'Dane pracownika',
    fullName: 'Imię i nazwisko',
    position: 'Stanowisko',
    department: 'Dział',
    email: 'Email',
    phone: 'Telefon',
    equipmentSection: 'Wydawany sprzęt',
    assetName: 'Nazwa zasobu',
    category: 'Kategoria',
    model: 'Model',
    serialNumber: 'Numer seryjny',
    statement:
      'Niniejszym potwierdzam odbiór wskazanego powyżej sprzętu w stanie technicznym dobrym, ' +
      'kompletnym wraz z wyposażeniem dodatkowym. Zobowiązuję się do użytkowania sprzętu zgodnie ' +
      'z jego przeznaczeniem oraz do jego zwrotu w stanie niepogorszonym na żądanie pracodawcy ' +
      'lub w przypadku ustania stosunku pracy.',
    signHandedOver: 'Data i podpis przekazującego',
    signReceived: 'Data i podpis odbierającego',
    dash: '—',
  },
  en: {
    title: 'Equipment handover form',
    issuedOn: 'Issued on',
    employeeSection: 'Employee details',
    fullName: 'Full name',
    position: 'Position',
    department: 'Department',
    email: 'Email',
    phone: 'Phone',
    equipmentSection: 'Equipment being handed over',
    assetName: 'Asset name',
    category: 'Category',
    model: 'Model',
    serialNumber: 'Serial number',
    statement:
      'I hereby confirm receipt of the equipment listed above in good technical condition, ' +
      'complete with any accessories. I agree to use it for its intended purpose and to return ' +
      'it in unimpaired condition upon request by the employer or upon termination of employment.',
    signHandedOver: 'Date and signature of the issuer',
    signReceived: 'Date and signature of the recipient',
    dash: '—',
  },
};

function resolveLang(lang?: string): Lang {
  return lang?.toLowerCase().startsWith('en') ? 'en' : 'pl';
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

function labelCell(text: string): TableCell {
  return new TableCell({
    width: { size: 30, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    children: [
      new Paragraph({
        children: [new TextRun({ text, color: '8A8A8A', size: 18 })],
      }),
    ],
  });
}

function valueCell(text: string | null | undefined, dash: string): TableCell {
  return new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || dash, size: 20 })],
      }),
    ],
  });
}

function dataTable(
  pairs: Array<[string, string | null | undefined]>,
  dash: string,
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: pairs.map(
      ([k, v]) => new TableRow({ children: [labelCell(k), valueCell(v, dash)] }),
    ),
  });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    borders: NO_BORDERS,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function deviceCell(text: string | null | undefined, dash: string): TableCell {
  return new TableCell({
    borders: NO_BORDERS,
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || dash, size: 18 })],
      }),
    ],
  });
}

function deviceTable(devices: Devices[], s: Record<string, string>): Table {
  const headerRow = new TableRow({
    children: [
      headerCell(s.assetName),
      headerCell(s.category),
      headerCell(s.model),
      headerCell(s.serialNumber),
    ],
  });
  const rows = devices.map(
    (d) =>
      new TableRow({
        children: [
          deviceCell(d.assetName, s.dash),
          deviceCell(d.group, s.dash),
          deviceCell(d.model, s.dash),
          deviceCell(d.serialNumber, s.dash),
        ],
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...rows],
  });
}

function signatureBlock(label: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    children: [
      new Paragraph({
        spacing: { before: 600 },
        children: [new TextRun('_______________________')],
      }),
      new Paragraph({
        children: [new TextRun({ text: label, size: 18, color: '8A8A8A' })],
      }),
    ],
  });
}

@Injectable()
export class HandoverFormService {
  constructor(
    @InjectRepository(Devices)
    private readonly devicesRepo: Repository<Devices>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private readonly formsService: FormsService,
  ) {}

  async renderForUser(userId: string, lang?: string): Promise<RenderResult> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const devices = await this.devicesRepo.find({
      where: { userId },
      order: { group: 'ASC', assetName: 'ASC' },
    });
    if (devices.length === 0) {
      throw new NotFoundException('User has no equipment assigned');
    }

    const resolvedLang = resolveLang(lang);
    const s = STRINGS[resolvedLang];
    const employeeName = `${user.name ?? ''} ${user.surname ?? ''}`.trim();
    const issuedOn = new Date().toLocaleDateString(
      resolvedLang === 'en' ? 'en-GB' : 'pl-PL',
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: s.title, bold: true })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: `${s.issuedOn}: ${issuedOn}`,
                  size: 18,
                  color: '8A8A8A',
                }),
              ],
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              children: [new TextRun(s.employeeSection)],
            }),
            dataTable(
              [
                [s.fullName, employeeName],
                [s.position, user?.title],
                [s.department, user?.department],
                [s.email, user?.email],
                [s.phone, user?.phone],
              ],
              s.dash,
            ),

            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
              children: [new TextRun(s.equipmentSection)],
            }),
            deviceTable(devices, s),

            new Paragraph({
              spacing: { before: 400, after: 400 },
              children: [new TextRun({ text: s.statement })],
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    signatureBlock(s.signHandedOver),
                    signatureBlock(s.signReceived),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const isoDate = new Date().toISOString().slice(0, 10);
    const filename = `handover-${user.id}-${Date.now()}.docx`;
    const displayName = `${s.title} - ${employeeName || user.username || user.id} - ${isoDate}.docx`;

    await this.formsService.create(
      {
        buffer,
        originalname: displayName,
        mimetype: HANDOVER_MIME,
        size: buffer.length,
      },
      user.id,
    );

    return { buffer, sha256, filename };
  }
}
