// Posts a release announcement to Bluesky via the AT Protocol.
//
// Two API calls: createSession (handle + app password -> access token), then
// createRecord (the post). Bluesky links and hashtags are not auto-detected —
// they only become clickable if the post carries "facets" with byte offsets
// into the UTF-8 text. This script computes those offsets and attaches them.
//
// Invoked from .github/workflows/release-announce.yml. Reads everything from
// env; never logs the app password. Exits non-zero on failure so the step is
// visibly red (but `continue-on-error` keeps it from blocking other channels).

const PDS = "https://bsky.social";
const MAX_POST_GRAPHEMES = 300; // Bluesky hard limit (graphemes; we stay well under)

const {
  BLUESKY_HANDLE: handle,
  BLUESKY_APP_PASSWORD: appPassword,
  TAG: tag,
  NAME: name,
  URL: url,
  BODY: body = "",
} = process.env;

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

if (!handle || !appPassword) {
  fail("BLUESKY_HANDLE or BLUESKY_APP_PASSWORD secret is not set.");
}

const version = name || tag || "release";

// Highlight-reel trim: first few changelog bullets, length-capped, so the post
// stays a readable summary rather than the whole changelog.
const notes =
  body
    .split("\n")
    .filter((line) => /^[*-]\s/.test(line))
    .slice(0, 4)
    .map((line) => "• " + line.replace(/^[*-]\s/, "").slice(0, 100))
    .join("\n") || "See the full changelog on GitHub.";

const hashtags = ["chess", "opensource"];
const text =
  `♟️ ChessVision ${version}\n\n${notes}\n\n${url}\n\n` +
  hashtags.map((t) => `#${t}`).join(" ");

// Facets index into the UTF-8 byte representation, not JS string indices, so
// build a byte view and locate each span by its byte offset.
const encoder = new TextEncoder();
const bytes = encoder.encode(text);

function byteIndexOf(sub, fromByte = 0) {
  const subBytes = encoder.encode(sub);
  outer: for (let i = fromByte; i <= bytes.length - subBytes.length; i++) {
    for (let j = 0; j < subBytes.length; j++) {
      if (bytes[i + j] !== subBytes[j]) continue outer;
    }
    return i;
  }
  return -1;
}

const facets = [];

// Link facet for the release URL.
const urlStart = byteIndexOf(url);
if (urlStart !== -1) {
  facets.push({
    index: { byteStart: urlStart, byteEnd: urlStart + encoder.encode(url).length },
    features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
  });
}

// Tag facets — search past the URL so a "#" inside the URL is never matched.
let cursor = urlStart === -1 ? 0 : urlStart;
for (const t of hashtags) {
  const token = `#${t}`;
  const start = byteIndexOf(token, cursor);
  if (start === -1) continue;
  facets.push({
    index: { byteStart: start, byteEnd: start + encoder.encode(token).length },
    features: [{ $type: "app.bsky.richtext.facet#tag", tag: t }],
  });
  cursor = start + encoder.encode(token).length;
}

// Grapheme-safe length guard (Intl.Segmenter counts user-perceived characters).
const graphemeCount = [...new Intl.Segmenter().segment(text)].length;
if (graphemeCount > MAX_POST_GRAPHEMES) {
  fail(`Post is ${graphemeCount} graphemes; Bluesky limit is ${MAX_POST_GRAPHEMES}.`);
}

async function api(path, payload, token) {
  const res = await fetch(`${PDS}/xrpc/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}: ${json.error || ""} ${json.message || ""}`);
  }
  return json;
}

try {
  const session = await api("com.atproto.server.createSession", {
    identifier: handle,
    password: appPassword,
  });

  await api(
    "com.atproto.repo.createRecord",
    {
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text,
        facets,
        createdAt: new Date().toISOString(),
        langs: ["en"],
      },
    },
    session.accessJwt,
  );

  console.log(`Announced ${version} to Bluesky.`);
} catch (err) {
  fail(`Bluesky post failed: ${err.message}`);
}
