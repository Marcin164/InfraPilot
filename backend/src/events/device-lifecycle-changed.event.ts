import { Devices } from 'src/entities/devices.entity';

export class DeviceLifecycleChangedEvent {
  constructor(
    public readonly deviceId: string,
    public readonly previous: Devices,
    public readonly updated: Devices,
    public readonly actorId?: string | null,
  ) {}
}
