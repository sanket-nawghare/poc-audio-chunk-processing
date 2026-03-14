import { AudioSession } from "../models/session.model";
import { AudioSessionMetadata } from "../models/metadata.model";

export class SessionStore {
  private readonly sessions = new Map<string, AudioSession>();
  private readonly metadata = new Map<string, AudioSessionMetadata>();

  getSession(sessionId: string): AudioSession | undefined {
    return this.sessions.get(sessionId);
  }

  saveSession(session: AudioSession): void {
    this.sessions.set(session.sessionId, session);
  }

  saveMetadata(value: AudioSessionMetadata): void {
    this.metadata.set(value.sessionId, value);
  }

  getMetadata(sessionId: string): AudioSessionMetadata | undefined {
    return this.metadata.get(sessionId);
  }
}

export const sessionStore = new SessionStore();
