import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validateAccessTokenAndGetUserClass } from 'src/helpers/propelAuthClient';
import { Users } from 'src/entities/users.entity';
import { Role, userHasAnyRole } from 'src/decorators/roles.decorator';
import { CommentType } from 'src/entities/ticketsComments.entity';

type Viewer = { userId: string; label: string };

// CORS for the WebSocket transport mirrors the REST CORS allow-list.
// Empty CORS_ORIGINS disables cross-origin entirely.
const wsOrigins = (() => {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return false;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
})();

@WebSocketGateway({
  cors: {
    origin: wsOrigins,
    credentials: true,
  },
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  /**
   * Active viewers per ticket — keyed by socketId so a single user with
   * multiple tabs counts once per tab; consumers can dedupe by userId.
   */
  private viewersByTicket = new Map<string, Map<string, Viewer>>();

  // Every socket must present a valid PropelAuth access token — handshake
  // auth payload (browser clients) or an Authorization header (non-browser
  // callers) — the same bar the REST AuthGuard enforces. Unauthenticated
  // sockets are dropped before they can join any ticket room. Staff status
  // is resolved once here (not per-join) and used to gate delivery of
  // Worknote comments -- see emitNewComment.
  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as any)?.token ||
      client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const user = await validateAccessTokenAndGetUserClass(token);
      const internalUserId =
        (user as any)?.properties?.metadata?.id || (user as any)?.userId || '';
      (client.data as any).internalUserId = internalUserId;

      const appUser = internalUserId
        ? await this.usersRepository.findOneBy({ id: internalUserId })
        : null;
      (client.data as any).isStaff = userHasAnyRole(appUser, [
        Role.Admin,
        Role.Approver,
        Role.Auditor,
        Role.Compliance,
        Role.Helpdesk,
        Role.Dpo,
      ]);
    } catch {
      client.disconnect(true);
    }
  }

  private snapshotViewers(ticketId: string): Viewer[] {
    const inner = this.viewersByTicket.get(ticketId);
    if (!inner) return [];
    const seen = new Map<string, Viewer>();
    for (const v of inner.values()) {
      if (!seen.has(v.userId)) seen.set(v.userId, v);
    }
    return Array.from(seen.values());
  }

  private broadcastViewers(ticketId: string) {
    this.server
      .to(`ticket:${ticketId}`)
      .emit('ticket.viewers', this.snapshotViewers(ticketId));
  }

  @SubscribeMessage('ticket.join')
  handleJoinTicket(
    @MessageBody() body: string | { ticketId: string; label?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Identity comes from the token verified in handleConnection, never
    // from the message body — the client only gets to pick a display label.
    const userId = (client.data as any)?.internalUserId;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const ticketId = typeof body === 'string' ? body : body.ticketId;
    const label = (typeof body === 'string' ? '' : body.label) || userId;

    client.join(`ticket:${ticketId}`);
    if ((client.data as any)?.isStaff) {
      client.join(`ticket:${ticketId}:staff`);
    }
    (client.data as any).ticketId = ticketId;

    const inner =
      this.viewersByTicket.get(ticketId) ??
      new Map<string, Viewer>();
    inner.set(client.id, { userId, label });
    this.viewersByTicket.set(ticketId, inner);
    this.broadcastViewers(ticketId);
  }

  @SubscribeMessage('ticket.leave')
  handleLeaveTicket(
    @MessageBody() body: string | { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const ticketId = typeof body === 'string' ? body : body.ticketId;
    client.leave(`ticket:${ticketId}`);
    client.leave(`ticket:${ticketId}:staff`);
    const inner = this.viewersByTicket.get(ticketId);
    if (inner) {
      inner.delete(client.id);
      if (inner.size === 0) this.viewersByTicket.delete(ticketId);
      this.broadcastViewers(ticketId);
    }
  }

  handleDisconnect(client: Socket) {
    const ticketId = (client.data as any)?.ticketId;
    if (!ticketId) return;
    const inner = this.viewersByTicket.get(ticketId);
    if (!inner) return;
    if (inner.delete(client.id)) {
      if (inner.size === 0) this.viewersByTicket.delete(ticketId);
      this.broadcastViewers(ticketId);
    }
  }

  // Worknote comments must never reach a non-staff viewer in real time --
  // route them to the staff-only sub-room instead of the ticket's main
  // room. Staff sockets join both (see handleJoinTicket), so they still
  // get every comment; everyone else only gets Public ones.
  emitNewComment(ticketId: string, payload: any) {
    const room =
      payload?.type === CommentType.WORKNOTE
        ? `ticket:${ticketId}:staff`
        : `ticket:${ticketId}`;
    this.server.to(room).emit('ticket.comment.created', payload);
  }

  emitTicketUpdated(ticketId: string, payload: any) {
    this.server.to(`ticket:${ticketId}`).emit('ticket.updated', payload);
  }

  emitTicketActivity(ticketId: string, payload: any) {
    this.server
      .to(`ticket:${ticketId}`)
      .emit('ticket.activity.created', payload);
  }
}
