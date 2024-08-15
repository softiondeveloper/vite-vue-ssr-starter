import { type ViteDevServer } from "vite";
import { type Express } from "express";
import fs from "node:fs";
import config from "./config";
import path from "node:path";
import { fileURLToPath } from "node:url";

let vite: ViteDevServer;

export default async (
  app: Express,
  isProd: boolean = !!config.IS_PRODUCTION,
): Promise<{
  vite: ViteDevServer;
  templateHtml: string;
  ssrManifest?: Record<string, any>;
}> => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const resolve = (p: string) => path.resolve(__dirname, p);

  const templateHtml = isProd
    ? fs.readFileSync(resolve("../dist/client/index.html"), "utf-8")
    : fs.readFileSync(resolve("../index.html"), "utf-8");

  const ssrManifest = isProd
    ? JSON.parse(
        fs.readFileSync(
          resolve("../dist/client/.vite/ssr-manifest.json"),
          "utf-8",
        ),
      )
    : undefined;

  if (isProd) {
    const serveStatic = await import("serve-static");
    const compression = (await import("compression")).default;
    const distClient = serveStatic.default(resolve("../dist/client"), {
      index: true,
    });

    app.use(compression());
    app.use("/test", distClient);
  } else {
    const { createServer } = await import("vite");

    vite = await createServer({
      logLevel: "info",
      server: { middlewareMode: true },
      base: config.BASE_URL,
    });

    app.use(vite.middlewares);
  }

  return {
    vite,
    templateHtml,
    ssrManifest,
  };
};
