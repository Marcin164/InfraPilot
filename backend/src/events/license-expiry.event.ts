export class LicenseExpiringEvent {
  constructor(
    public readonly licenseId: string,
    public readonly expiresAt: Date,
    public readonly daysRemaining: number,
  ) {}
}

export class LicenseExpiredEvent {
  constructor(
    public readonly licenseId: string,
    public readonly expiresAt: Date,
  ) {}
}
