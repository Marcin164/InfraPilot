import { Tickets } from 'src/entities/tickets.entity';

export class TicketStateChangedEvent {
  constructor(
    public readonly ticket: Tickets,
    public readonly previousState: string | null,
    public readonly newState: string,
    public readonly actorId?: string | null,
  ) {}
}
