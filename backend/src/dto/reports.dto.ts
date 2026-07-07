import { IsArray, IsString } from 'class-validator';

export class BatchReportsDto {
  @IsArray() @IsString({ each: true }) types: string[];
}
