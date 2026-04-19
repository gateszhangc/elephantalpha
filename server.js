const http = require("http");
const fs = require("fs");
const path = require("path");

const host = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const root = __dirname;
const envFiles = process.env.NODE_ENV === "production" ? [".env.production", ".env.development"] : [".env.development", ".env.production"];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".manifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const parseEnvFile = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.split(/\r?\n/).reduce((accumulator, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) return accumulator;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 0) return accumulator;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
  } catch (error) {
    return {};
  }
};

const runtimeEnv = envFiles.reduce((accumulator, envFile) => {
  const fileValues = parseEnvFile(path.join(root, envFile));
  return { ...accumulator, ...fileValues };
}, {});

const siteConfig = {
  ga4MeasurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || runtimeEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "",
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || runtimeEnv.NEXT_PUBLIC_CLARITY_PROJECT_ID || ""
};

const send = (response, statusCode, headers, body) => {
  response.writeHead(statusCode, headers);
  response.end(body);
};

const serveFile = (requestPath, response) => {
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.join(root, safePath);

  if (!resolvedPath.startsWith(root)) {
    send(response, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, body) => {
    if (error) {
      if (error.code === "ENOENT") {
        send(response, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found");
        return;
      }

      send(response, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Internal Server Error");
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const cacheControl = ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable";
    const payload =
      ext === ".html"
        ? Buffer.from(body.toString("utf8").replace("__SITE_CONFIG_JSON__", JSON.stringify(siteConfig)), "utf8")
        : body;

    send(
      response,
      200,
      {
        "Cache-Control": cacheControl,
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff"
      },
      payload
    );
  });
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/healthz") {
    send(response, 200, { "Content-Type": "application/json; charset=utf-8" }, JSON.stringify({ ok: true }));
    return;
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  serveFile(pathname, response);
});

server.listen(port, host, () => {
  console.log(`Static site listening on http://${host}:${port}`);
});
