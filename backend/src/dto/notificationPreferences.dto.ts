import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PreferenceRowDto } from 'src/dto/notification.dto';

export class UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceRowDto)
  rows: PreferenceRowDto[];
}
