const https = require("https");
const http = require("http");

function fetchUrl(url, maxLen = 15000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "Coryphaeus-Workbench/1.0" }, timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, maxLen).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; if (body.length > maxLen * 2) res.destroy(); });
      res.on("end", () => resolve(body));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function regexExtract(text) {
  const suggestions = [];
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // Action items: "Action: ...", "TODO: ...", "Action item: ..."
    const actionMatch = trimmed.match(/^(?:action\s*(?:item)?|todo|task|priority|follow[- ]?up)\s*[:—-]\s*(.+)/i);
    if (actionMatch) {
      suggestions.push({ title: actionMatch[1].trim().slice(0, 120), description: "", confidence: 0.7 });
      continue;
    }
    // Numbered items: "1. ...", "1) ..."
    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numMatch && numMatch[1].length > 10 && numMatch[1].length < 200) {
      const text = numMatch[1].trim();
      // Only include if it sounds like a task (contains a verb-like word near start)
      if (/^(implement|build|create|add|fix|update|review|set up|establish|develop|integrate|design|prepare|schedule|plan|analyze|evaluate|migrate|deploy|test|launch|research|investigate|define|document|configure|ensure|enable|improve|optimize|resolve|address|complete|finalize|prioritize|assess)/i.test(text)) {
        suggestions.push({ title: text.slice(0, 120), description: "", confidence: 0.5 });
      }
    }
    // Bullet points with actionable content: "- ...", "• ..."
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch && bulletMatch[1].length > 10 && bulletMatch[1].length < 200) {
      const text = bulletMatch[1].trim();
      if (/^(implement|build|create|add|fix|update|review|set up|establish|develop|integrate|design|prepare|schedule|plan|analyze|evaluate|migrate|deploy|test|launch|research|investigate|define|document|configure|ensure|enable|improve|optimize|resolve|address|complete|finalize|prioritize|assess|need to|should|must|will|we'll|let's|going to)/i.test(text)) {
        suggestions.push({ title: text.slice(0, 120), description: "", confidence: 0.4 });
      }
    }
  }

  // Deduplicate by title similarity
  const seen = new Set();
  return suggestions.filter(s => {
    const key = s.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
}

async function callClaude(text, type) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = type === "transcript"
    ? `Extract actionable priorities from this call transcript. Return JSON with a "suggestions" array where each item has "title" (concise action item, max 120 chars), "description" (1-2 sentence context), and "confidence" (0.0-1.0 how clearly this was stated as a priority).\n\nTranscript:\n${text.slice(0, 15000)}`
    : `Extract actionable priorities from this webpage content. Return JSON with a "suggestions" array where each item has "title" (concise action item, max 120 chars), "description" (1-2 sentence context), and "confidence" (0.0-1.0 how relevant this is as a priority).\n\nContent:\n${text.slice(0, 15000)}`;

  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    system: "You extract priorities from text. Always respond with valid JSON only, no markdown fences. Format: { \"suggestions\": [{ \"title\": \"...\", \"description\": \"...\", \"confidence\": 0.8 }] }"
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      timeout: 30000
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text || "";
          const json = JSON.parse(text);
          if (json.suggestions && Array.isArray(json.suggestions)) {
            resolve(json.suggestions.slice(0, 15));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

module.exports = async function (context, req) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };

  if (req.method !== "POST") {
    context.res = { status: 405, headers, body: JSON.stringify({ error: "POST only" }) };
    return;
  }

  try {
    const { type, content } = req.body || {};
    if (!type || !content) {
      context.res = { status: 400, headers, body: JSON.stringify({ error: "type and content required" }) };
      return;
    }

    let text = content;

    if (type === "url") {
      try {
        const html = await fetchUrl(content);
        text = stripHtml(html).slice(0, 15000);
      } catch (e) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: `Failed to fetch URL: ${e.message}` }) };
        return;
      }
    }

    // Try Claude first, fall back to regex
    let suggestions = await callClaude(text, type);
    let method = "ai";

    if (!suggestions) {
      suggestions = regexExtract(text);
      method = "regex";
    }

    context.res = {
      status: 200,
      headers,
      body: JSON.stringify({ suggestions, method })
    };
  } catch (error) {
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
