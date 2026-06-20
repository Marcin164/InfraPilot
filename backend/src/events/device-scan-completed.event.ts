export class DeviceScanCompletedEvent {
  constructor(
    public readonly deviceId: string,
    public readonly scanId: string,
  ) {}
}
