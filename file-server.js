#!/usr/bin/env node
/**
 * Simple file server for OpenClaw Dashboard.
 * Serves files from whitelisted directories with token auth.
 * 
 * Usage: node file-server.js
 * Env: FILE_SERVER_TOKEN, FILE_SERVER_PORT (default 3457)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = parseInt(process.env.FILE_SERVER_PORT || "3457");
const TOKEN = process.env.FILE_SERVER_TOKEN || "d67aab65b5490d1f005a51a2f12fc12375ba64c23565f3011bfe36b9e75032f9";

// Whitelisted directories
const ALLOWED_DIRS = [
  path.resolve(process.env.HOME, "clawd"),
  "/tmp",
  path.resolve(process.env.HOME, "Projects"),
  path.resolve(process.env.HOME, "Downloads"),
];

const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".py": "text/x-python",
  ".zip": "application/zip",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

function isAllowed(filePath) {
  const resolved = path.resolve(filePath);
  return ALLOWED_DIRS.some((dir) => resolved.startsWith(dir + "/") || resolved === dir);
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // Auth
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${TOKEN}`) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const parsed = url.parse(req.url, true);

  // GET /file?path=/path/to/file
  if (parsed.pathname === "/file" && req.method === "GET") {
    const filePath = parsed.query.path;
    if (!filePath || typeof filePath !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "missing path parameter" }));
      return;
    }

    const resolved = path.resolve(filePath);
    if (!isAllowed(resolved)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "path not in allowed directories" }));
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "file not found" }));
      return;
    }

    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not a file" }));
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const filename = path.basename(resolved);

    res.writeHead(200, {
      "Content-Type": mime,
      "Content-Length": stat.size,
      "Content-Disposition": `inline; filename="${filename}"`,
    });
    fs.createReadStream(resolved).pipe(res);
    return;
  }

  // GET /list?dir=/path/to/dir
  if (parsed.pathname === "/list" && req.method === "GET") {
    const dirPath = parsed.query.dir;
    if (!dirPath || typeof dirPath !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "missing dir parameter" }));
      return;
    }

    const resolved = path.resolve(dirPath);
    if (!isAllowed(resolved)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "directory not allowed" }));
      return;
    }

    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const files = entries.map((e) => ({
        name: e.name,
        isFile: e.isFile(),
        isDir: e.isDirectory(),
        size: e.isFile() ? fs.statSync(path.join(resolved, e.name)).size : 0,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ dir: resolved, files }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found", routes: ["/file?path=...", "/list?dir=..."] }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`File server running on http://127.0.0.1:${PORT}`);
  console.log(`Allowed dirs: ${ALLOWED_DIRS.join(", ")}`);
});
