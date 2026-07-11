import { existsSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const apiDir = "src/app/api";
const disabledApiDir = "src/app/_api_disabled_for_pages";
const runtimeBuildDir = ".next";
const runtimeBuildBackupDir = ".next-runtime-backup";
let moved = false;
let backedUpRuntimeBuild = false;

try {
  rmSync(".next-pages", { force: true, recursive: true });
  rmSync(runtimeBuildBackupDir, { force: true, recursive: true });

  if (existsSync(runtimeBuildDir)) {
    renameSync(runtimeBuildDir, runtimeBuildBackupDir);
    backedUpRuntimeBuild = true;
  }

  if (existsSync(apiDir)) {
    renameSync(apiDir, disabledApiDir);
    moved = true;
  }

  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm run build"] : ["run", "build"];
  const result = spawnSync(command, args, {
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_OUTPUT_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH: "/DEVMATCH",
    },
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
  }

  process.exitCode = result.status ?? 1;
} finally {
  if (moved && existsSync(disabledApiDir)) {
    renameSync(disabledApiDir, apiDir);
  }

  rmSync(runtimeBuildDir, { force: true, recursive: true });

  if (backedUpRuntimeBuild && existsSync(runtimeBuildBackupDir)) {
    renameSync(runtimeBuildBackupDir, runtimeBuildDir);
  }
}
