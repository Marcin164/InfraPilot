import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCalendarDto {
  @IsNotEmpty() @IsString() name: string;
  @IsArray() @IsInt({ each: true }) workingDays: number[];
  @IsNotEmpty() @IsString() timezone: string;
  @IsOptional() @IsString() workStart?: string | null;
  @IsOptional() @IsString() workEnd?: string | null;
}

export class UpdateCalendarDto {
  @IsNotEmpty() @IsString() name: string;
  @IsArray() @IsInt({ each: true }) workingDays: number[];
  @IsNotEmpty() @IsString() timezone: string;
  @IsOptional() @IsString() workStart?: string | null;
  @IsOptional() @IsString() workEnd?: string | null;

  // EditCalendarForm.tsx's edit branch spreads the whole loaded SlaCalendar
  // object back into the PATCH body (incl. id, and a remapped `holidays`
  // array) -- neither is read by CalendarService.update(), accepted here
  // only so the request doesn't 400.
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsArray() holidays?: unknown[];
}

export class AddHolidayDto {
  @IsNotEmpty() @IsString() date: string;

  // EditHolidaysForm.tsx has no description input -- it always sends "".
  @IsString() description: string;

  // postCalendarHoliday() sends the calendar id in the body too, duplicating
  // the URL param -- accepted and ignored (CalendarService.addHoliday reads
  // it from the URL param, not the body).
  @IsOptional() @IsString() id?: string;
}
