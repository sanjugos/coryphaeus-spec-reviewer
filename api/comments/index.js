const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

// Use Azure Table Storage (included free with Static Web Apps)
// Connection string comes from environment variable
const TABLE_NAME = "speccomments";

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
      // Return all comments
      if (!client) {
        context.res = { status: 200, headers, body: JSON.stringify({}) };
        return;
      }
      const entities = client.listEntities({ queryOptions: { filter: `PartitionKey eq 'comments'` } });
      let comments = {};
      for await (const entity of entities) {
        comments[entity.rowKey] = JSON.parse(entity.data);
      }
      context.res = { status: 200, headers, body: JSON.stringify(comments) };

    } else if (req.method === "POST") {
      // Save all comments (full replace)
      const data = req.body;
      if (!client) {
        context.res = { status: 200, headers, body: JSON.stringify({ ok: true, storage: "none" }) };
        return;
      }

      // Delete existing entries
      const existing = client.listEntities({ queryOptions: { filter: `PartitionKey eq 'comments'` } });
      for await (const entity of existing) {
        try { await client.deleteEntity("comments", entity.rowKey); } catch {}
      }

      // Insert new entries
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
          await client.upsertEntity({
            partitionKey: "comments",
            rowKey: key,
            data: JSON.stringify(value)
          });
        }
      }

      context.res = { status: 200, headers, body: JSON.stringify({ ok: true, count: Object.keys(data).length }) };
    }
  } catch (error) {
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
