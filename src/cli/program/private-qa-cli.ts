import { loadBundledPluginPublicSurfaceModuleSync } from "../../plugin-sdk/facade-loader.js";

export function isPrivateQaCliEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.OPENCLAW_ENABLE_PRIVATE_QA_CLI === "1";
}

export function loadPrivateQaCliModule(): Promise<Record<string, unknown>> {
  return Promise.resolve(
    loadBundledPluginPublicSurfaceModuleSync<Record<string, unknown>>({
      dirName: "qa-lab",
      artifactBasename: "cli.js",
    }),
  );
}
