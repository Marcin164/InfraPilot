import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const EVIDENCE_INCLUDES = ['audit', 'reports', 'tickets'] as const;

export class BuildEvidencePackDto {
  @IsNotEmpty() @IsString() from: string;
  @IsNotEmpty() @IsString() to: string;

  @IsArray()
  @IsIn(EVIDENCE_INCLUDES, { each: true })
  include: (typeof EVIDENCE_INCLUDES)[number][];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reportTypes?: string[];
}
