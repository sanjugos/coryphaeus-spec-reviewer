import express from "express";
import { createServer } from "http";
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationServiceClientCredentialFactory,
  TurnContext,
} from "botbuilder";
import { CoryphaeusBot } from "./bot";
import { MediaWebSocketServer } from "./websocket/media-server";
import { initializeDatabase, needsSeeding } from "./crm/database";
import { seedDatabase } from "./crm/seed";

// Load environment variables
const PORT = process.env.PORT || 3978;

// Credential factory with app ID + password
const credentialFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.BOT_ID || "",
  MicrosoftAppPassword: process.env.BOT_PASSWORD || "",
  MicrosoftAppType: "SingleTenant",
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID || "",
});

// Bot Framework authentication
const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialFactory
);

// Create adapter
const adapter = new CloudAdapter(botFrameworkAuth);

// Error handler
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error(`[Bot Error] ${error.message}`);
  console.error(error.stack);
  await context.sendActivity("Sorry, something went wrong. Please try again.");
};

// Create bot
const bot = new CoryphaeusBot();

// Express server
const app = express();
app.use(express.json());

// Create HTTP server (needed for WebSocket upgrade)
const httpServer = createServer(app);

// Attach WebSocket server for C# media bot communication
const mediaWs = new MediaWebSocketServer(httpServer, bot.engine);

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Bot Framework messaging endpoint
app.post("/api/messages", async (req, res) => {
  try {
    await adapter.process(req, res, (context) => bot.run(context));
  } catch (err) {
    console.error("[Adapter Error]", err);
    if (!res.headersSent) {
      res.status(500).send("Bot processing error");
    }
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "coryphaeus-teams-agent",
    version: "1.3.0",
    timestamp: new Date().toISOString(),
    mediaWebSocket: {
      connections: mediaWs.getConnectionCount(),
      activeSessions: mediaWs.getActiveSessions(),
    },
  });
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    if (await needsSeeding()) {
      await seedDatabase();
    } else {
      console.log("[DB] Data already exists, skipping seed");
    }
  } catch (err) {
    console.error("[DB] Database initialization failed:", err);
    console.log("[DB] Bot will start but CRM queries may fail");
  }

  httpServer.listen(PORT, () => {
    console.log(`\nCoryphaeus Teams Agent v1.3.0 running on port ${PORT}`);
    console.log(`Bot endpoint: http://localhost:${PORT}/api/messages`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Media WebSocket: ws://localhost:${PORT}/ws/media\n`);
  });
}

start();
