export class PurchaseOrderReceivedEvent {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly title: string,
    public readonly receivedAt: Date,
  ) {}
}
