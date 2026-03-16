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

async function getAuthClient() {
  const keyFile = credentialsPath
    ?? (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(DEFAULT_CREDENTIALS_PATH)
        ? DEFAULT_CREDENTIALS_PATH
        : undefined
    );

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return auth;
}

async function getWriteAuthClient() {
  const keyFile = credentialsPath
    ?? (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(DEFAULT_CREDENTIALS_PATH)
        ? DEFAULT_CREDENTIALS_PATH
        : undefined
    );

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters"],
  });

  return auth;
}

export async function createSearchConsoleClient() {
  const auth = await getAuthClient();
  return google.searchconsole({ version: "v1", auth });
}

export async function createWebmastersClient() {
  const auth = await getAuthClient();
  return google.webmasters({ version: "v3", auth });
}

export async function createWriteWebmastersClient() {
  const auth = await getWriteAuthClient();
  return google.webmasters({ version: "v3", auth });
}
