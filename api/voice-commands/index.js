const { TableClient } = require("@azure/data-tables");

const TABLE_NAME = "specvoicecommands";

async function getTableClient() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) return null;
  const client = TableClient.fromConnectionString(connStr, TABLE_NAME);
  try { await client.createTable(); } catch (e) { /* table exists */ }
  return client;
}

module.exports = async function (context, req) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };

  try {
    const client = await getTableClient();

    if (req.method === "GET") {
      if (!client) {
        context.res = { status: 200, headers, body: JSON.stringify([]) };
        return;
      }
      try {
        const entity = await client.getEntity("voicecommands", "all");
        context.res = { status: 200, headers, body: entity.data || "[]" };
      } catch (e) {
        context.res = { status: 200, headers, body: JSON.stringify([]) };
      }

    } else if (req.method === "POST") {
      const body = req.body;
      if (!client) {
        context.res = { status: 200, headers, body: JSON.stringify({ ok: true, storage: "none" }) };
        return;
      }

      if (body && body.incrementUsage) {
        // Increment usage count for a specific command
        let commands = [];
        try {
          const entity = await client.getEntity("voicecommands", "all");
          commands = JSON.parse(entity.data || "[]");
        } catch (e) { /* no data yet */ }
        const cmd = commands.find(c => c.trigger === body.trigger);
        if (cmd) {
          cmd.usageCount = (cmd.usageCount || 0) + 1;
          cmd.lastUsed = new Date().toISOString();
        }
        await client.upsertEntity({
          partitionKey: "voicecommands",
          rowKey: "all",
          data: JSON.stringify(commands)
        });
        context.res = { status: 200, headers, body: JSON.stringify({ ok: true }) };
      } else {
        // Save full commands array
        const data = body.commands || body;
        await client.upsertEntity({
          partitionKey: "voicecommands",
          rowKey: "all",
          data: JSON.stringify(data)
        });
        context.res = { status: 200, headers, body: JSON.stringify({ ok: true, count: Array.isArray(data) ? data.length : 0 }) };
      }
    }
  } catch (error) {
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
