import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // Cache policy: hashed bundles under /assets/ are immutable; HTML (entry
  // point + SPA fallback) must always revalidate so deploys reach browsers
  // that cached an older index.html.
  app.use("*", async (c, next) => {
    const p = c.req.path;
    if (p.startsWith("/assets/")) {
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    } else if (p === "/" || p.endsWith(".html")) {
      c.header("Cache-Control", "no-cache, must-revalidate");
    }
    await next();
  });

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    c.header("Cache-Control", "no-cache, must-revalidate");
    return c.html(content);
  });
}
