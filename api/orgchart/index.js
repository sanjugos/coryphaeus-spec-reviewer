const { TableClient } = require("@azure/data-tables");

const TABLE_NAME = "specorgchart";

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
        context.res = { status: 200, headers, body: JSON.stringify({ nodes: [], edges: [], views: [] }) };
        return;
      }
      try {
        const entity = await client.getEntity("orgchart", "all");
        context.res = { status: 200, headers, body: entity.data || JSON.stringify({ nodes: [], edges: [], views: [] }) };
      } catch (e) {
        context.res = { status: 200, headers, body: JSON.stringify({ nodes: [], edges: [], views: [] }) };
      }

    } else if (req.method === "POST") {
      const data = req.body;
      if (!client) {
        context.res = { status: 200, headers, body: JSON.stringify({ ok: true, storage: "none" }) };
        return;
      }

      await client.upsertEntity({
        partitionKey: "orgchart",
        rowKey: "all",
        data: JSON.stringify(data)
      });

      context.res = { status: 200, headers, body: JSON.stringify({ ok: true }) };
    }
  } catch (error) {
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
