import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { assertNotOAuthClientFile } from "../src/auth.js";
import { warnIfNoSites } from "../src/commands/sites.js";
import { withCredentialsHint } from "../src/utils.js";

function writeTempJson(data: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gsc-cli-test-"));
  const file = path.join(dir, "credentials.json");
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}

function captureStderr(fn: () => void): string {
  const original = process.stderr.write;
  let output = "";
  process.stderr.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stderr.write;
  try {
    fn();
  } finally {
    process.stderr.write = original;
  }
  return output;
}

test("withCredentialsHint explains where to put credentials", () => {
  const message = withCredentialsHint(
    "Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.",
  );
  assert.match(message, /--credentials <path>/);
  assert.match(message, /GOOGLE_APPLICATION_CREDENTIALS/);
  assert.match(message, /~\/\.config\/google-search-console-cli\/credentials\.json/);
  assert.match(message, /#setup/);
});

test("withCredentialsHint keeps other messages", () => {
  assert.equal(withCredentialsHint("Permission denied"), "Permission denied");
});

test("assertNotOAuthClientFile rejects installed and web client files", () => {
  for (const key of ["installed", "web"]) {
    const file = writeTempJson({ [key]: { client_id: "id", client_secret: "secret" } });
    assert.throws(() => assertNotOAuthClientFile(file), /is an OAuth client file, not a service account key/);
  }
});

test("assertNotOAuthClientFile accepts service account keys and missing files", () => {
  const file = writeTempJson({ type: "service_account", client_email: "a@b.iam.gserviceaccount.com" });
  assert.doesNotThrow(() => assertNotOAuthClientFile(file));
  assert.doesNotThrow(() => assertNotOAuthClientFile(undefined));
  assert.doesNotThrow(() => assertNotOAuthClientFile(path.join(os.tmpdir(), "does-not-exist.json")));
});

test("warnIfNoSites writes a hint to stderr only for an empty list", () => {
  assert.match(captureStderr(() => warnIfNoSites([])), /No sites found\..*#step-4-grant-access-in-search-console/);
  assert.equal(captureStderr(() => warnIfNoSites([{ siteUrl: "sc-domain:example.com" }])), "");
});
