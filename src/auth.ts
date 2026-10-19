import { google } from "googleapis";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export { version };

const DEFAULT_CREDENTIALS_PATH = path.join(
  os.homedir(),
  ".config",
  "google-search-console-cli",
  "credentials.json",
);

let credentialsPath: string | undefined;

export function setCredentialsPath(p: string): void {
  credentialsPath = p;
}

function resolveKeyFile(): string | undefined {
  return credentialsPath
    ?? (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(DEFAULT_CREDENTIALS_PATH)
        ? DEFAULT_CREDENTIALS_PATH
        : undefined
    );
}

// OAuth client files (from "Create OAuth client ID") have a top-level
// "installed" or "web" field. googleauth only reports a missing client_email
// for them, so detect them here and say what the file is.
export function assertNotOAuthClientFile(file: string | undefined): void {
  if (!file || !fs.existsSync(file)) return;
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return;
  }
  if (json && typeof json === "object" && ("installed" in json || "web" in json)) {
    throw new Error(
      `${file} is an OAuth client file, not a service account key. ` +
      "Download a JSON key from the service account's Keys tab, " +
      "or use this file with gcloud --client-id-file. " +
      "See https://github.com/Bin-Huang/google-search-console-cli#alternative-application-default-credentials",
    );
  }
}

function getAuthClient(scope: string) {
  const keyFile = resolveKeyFile();
  assertNotOAuthClientFile(keyFile ?? process.env.GOOGLE_APPLICATION_CREDENTIALS);

  return new google.auth.GoogleAuth({
    keyFile,
    scopes: [scope],
  });
}

const READ_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const WRITE_SCOPE = "https://www.googleapis.com/auth/webmasters";

export async function createSearchConsoleClient() {
  const auth = getAuthClient(READ_SCOPE);
  return google.searchconsole({ version: "v1", auth });
}

export async function createWebmastersClient() {
  const auth = getAuthClient(READ_SCOPE);
  return google.webmasters({ version: "v3", auth });
}

export async function createWriteWebmastersClient() {
  const auth = getAuthClient(WRITE_SCOPE);
  return google.webmasters({ version: "v3", auth });
}
