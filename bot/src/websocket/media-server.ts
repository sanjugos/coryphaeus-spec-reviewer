import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { ClaudeEngine } from "../claude/engine";

// Message types sent from C# media bot → Node.js
interface TranscriptionMessage {
  type: "transcription";
  meetingId: string;
  participantId: string;
  displayName: string;
  text: string;
  isFinal: boolean;
}

interface MeetingEventMessage {
  type: "meeting_joined" | "meeting_left";
  meetingId: string;
}

type InboundMessage = TranscriptionMessage | MeetingEventMessage;

// Message types sent from Node.js → C# media bot
interface SpeakMessage {
  type: "speak";
  meetingId: string;
  text: string;
}

interface AckMessage {
  type: "ack";
  meetingId: string;
}

type OutboundMessage = SpeakMessage | AckMessage;

// Per-meeting state tracked on the WebSocket side
interface MeetingSession {
  meetingId: string;
  socket: WebSocket;
  lastInterjectionTime: number;
  transcriptBuffer: string[];
}

const INTERJECTION_COOLDOWN_MS = 120_000; // 2 minutes
const MAX_TRANSCRIPT_BUFFER = 50;

export class MediaWebSocketServer {
  private wss: WebSocketServer;
  private engine: ClaudeEngine;
  private sessions: Map<string, MeetingSession> = new Map();

  constructor(server: HttpServer, engine: ClaudeEngine) {
    this.engine = engine;
    this.wss = new WebSocketServer({ server, path: "/ws/media" });
    this.init();
  }

  private init(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[MediaWS] C# media bot connected");

      ws.on("message", (data: WebSocket.RawData) => {
        try {
          const msg: InboundMessage = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch (err) {
          console.error("[MediaWS] Invalid message:", err);
        }
      });

      ws.on("close", () => {
        console.log("[MediaWS] C# media bot disconnected");
        // Clean up sessions associated with this socket
        for (const [meetingId, session] of this.sessions) {
          if (session.socket === ws) {
            this.sessions.delete(meetingId);
            this.engine.clearConversation(`media-${meetingId}`);
            console.log(`[MediaWS] Cleaned up session for meeting ${meetingId}`);
          }
        }
      });

      ws.on("error", (err: Error) => {
        console.error("[MediaWS] Socket error:", err.message);
      });
    });

    console.log("[MediaWS] WebSocket server listening on /ws/media");
  }

  private handleMessage(ws: WebSocket, msg: InboundMessage): void {
    switch (msg.type) {
      case "meeting_joined":
        this.onMeetingJoined(ws, msg.meetingId);
        break;
      case "meeting_left":
        this.onMeetingLeft(msg.meetingId);
        break;
      case "transcription":
        this.onTranscription(ws, msg);
        break;
      default:
        console.warn("[MediaWS] Unknown message type:", (msg as { type: string }).type);
    }
  }

  private onMeetingJoined(ws: WebSocket, meetingId: string): void {
    this.sessions.set(meetingId, {
      meetingId,
      socket: ws,
      lastInterjectionTime: 0,
      transcriptBuffer: [],
    });
    console.log(`[MediaWS] Meeting joined: ${meetingId}`);

    const ack: AckMessage = { type: "ack", meetingId };
    ws.send(JSON.stringify(ack));
  }

  private onMeetingLeft(meetingId: string): void {
    this.sessions.delete(meetingId);
    this.engine.clearConversation(`media-${meetingId}`);
    console.log(`[MediaWS] Meeting left: ${meetingId}`);
  }

  private async onTranscription(ws: WebSocket, msg: TranscriptionMessage): Promise<void> {
    // Only process final (complete) transcriptions
    if (!msg.isFinal) return;

    const session = this.sessions.get(msg.meetingId);
    if (!session) return;

    // Buffer the transcript
    session.transcriptBuffer.push(`${msg.displayName}: ${msg.text}`);
    if (session.transcriptBuffer.length > MAX_TRANSCRIPT_BUFFER) {
      session.transcriptBuffer.shift();
    }

    // Check cooldown (bypass if directly addressed)
    const now = Date.now();
    const textLower = msg.text.toLowerCase();
    const directlyAddressed =
      textLower.includes("coryphaeus") ||
      textLower.includes("hey crm") ||
      textLower.includes("@coryphaeus");

    if (!directlyAddressed && now - session.lastInterjectionTime < INTERJECTION_COOLDOWN_MS) {
      return;
    }

    // Ask Claude if we should interject
    const result = await this.engine.processMeetingTranscript(
      msg.meetingId,
      msg.text,
      msg.displayName
    );

    if (result.shouldInterject && result.response) {
      session.lastInterjectionTime = now;

      // Send "speak" command back to C# media bot for TTS
      const speakMsg: SpeakMessage = {
        type: "speak",
        meetingId: msg.meetingId,
        text: result.response,
      };
      ws.send(JSON.stringify(speakMsg));

      console.log(
        `[MediaWS] Speak response for meeting ${msg.meetingId}: ${result.response.substring(0, 80)}...`
      );
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  getConnectionCount(): number {
    return this.wss.clients.size;
  }
}
