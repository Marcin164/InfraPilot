import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

type BootstrapEntry = {
  baseUrl: string;
  token: string;
  expiresAt: number;
};

/**
 * Turns the one-time enrollment bootstrap payload (backend URL + shared
 * agent token) into a short-lived, random code so the admin-facing install
 * snippet never contains the raw secret. The snippet only ever types/pastes
 * `curl .../bootstrap/<code>/<platform> | sudo bash` — the code is what
 * lands in shell history / process listings, and it's worthless after
 * TTL_MS regardless of who sees it.
 */
@Injectable()
export class AgentBootstrapService {
  private readonly TTL_MS = 10 * 60 * 1000;
  private codes = new Map<string, BootstrapEntry>();

  mint(baseUrl: string, token: string): string {
    this.cleanup();
    const code = randomBytes(24).toString('base64url');
    this.codes.set(code, { baseUrl, token, expiresAt: Date.now() + this.TTL_MS });
    return code;
  }

  redeem(code: string): { baseUrl: string; token: string } | null {
    this.cleanup();
    const entry = this.codes.get(code);
    if (!entry) return null;
    return { baseUrl: entry.baseUrl, token: entry.token };
  }

  private cleanup() {
    const now = Date.now();
    for (const [code, entry] of this.codes) {
      if (entry.expiresAt < now) this.codes.delete(code);
    }
  }
}
