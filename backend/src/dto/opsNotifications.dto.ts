import { ArrayMaxSize, IsArray, IsEmail, IsObject } from 'class-validator';

// `channels` is a Record<event, {inapp,email}> map keyed by dynamic event
// names -- class-validator doesn't have great support for validating
// dynamic-keyed objects, so we only check the outer shape here and let
// OpsNotificationsService.saveConfig() sanitize each entry (falls back to
// sane defaults for anything missing or malformed).
export class SaveOpsNotificationConfigDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  emails: string[];

  @IsObject()
  channels: Record<string, { inapp?: boolean; email?: boolean }>;
}
