import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { GoogleAuth, Impersonated, OAuth2Client } from "google-auth-library";
import {
  createSearchConsoleClient,
  createWebmastersClient,
  createWriteWebmastersClient,
  setImpersonationTarget,
} from "../src/auth.js";

const target = "search-console@example.iam.gserviceaccount.com";

for (const [name, createClient, scope] of [
  ["URL inspection", createSearchConsoleClient, "webmasters.readonly"],
  ["reporting", createWebmastersClient, "webmasters.readonly"],
  ["writes", createWriteWebmastersClient, "webmasters"],
] as const) {
  test(`${name} exchanges source credentials for the target with the correct scope`, async (t) => {
    t.after(() => setImpersonationTarget(undefined));
    setImpersonationTarget(target);
    const source = new OAuth2Client();
    t.mock.method(source, "getAccessToken", async () => ({ token: "source-token" }));
    const exchange = t.mock.method(source, "request", async (options) => {
      assert.equal(options.url,
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${target}:generateAccessToken`);
      assert.deepEqual(options.data, {
        delegates: [],
        scope: [`https://www.googleapis.com/auth/${scope}`],
        lifetime: "3600s",
      });
      return { data: { accessToken: "target-token", expireTime: "2099-01-01T00:00:00Z" } };
    });
    t.mock.method(GoogleAuth.prototype, "getClient", async function (this: GoogleAuth) {
      assert.deepEqual(this.scopes, ["https://www.googleapis.com/auth/cloud-platform"]);
      return source;
    });

    const client = await createClient();
    const auth = client.context._options.auth;
    assert.ok(auth instanceof Impersonated);
    const headers = await auth.getRequestHeaders();
    assert.equal(headers.get("authorization"), "Bearer target-token");
    assert.equal(exchange.mock.callCount(), 1);
  });
}

test("omitting impersonation preserves lazy direct authentication", async (t) => {
  setImpersonationTarget(undefined);
  const resolve = t.mock.method(GoogleAuth.prototype, "getClient", async () => {
    throw new Error("Direct credentials must not be resolved while constructing the client");
  });
  const client = await createWebmastersClient();
  const auth = client.context._options.auth;
  assert.ok(auth instanceof GoogleAuth);
  assert.deepEqual(auth.scopes, ["https://www.googleapis.com/auth/webmasters.readonly"]);
  assert.equal(resolve.mock.callCount(), 0);
});

test("source credential failure does not fall back to direct access", async (t) => {
  t.after(() => setImpersonationTarget(undefined));
  setImpersonationTarget(target);
  t.mock.method(GoogleAuth.prototype, "getClient", async () => {
    throw new Error("source credentials unavailable");
  });
  await assert.rejects(createWebmastersClient(), /source credentials unavailable/);
});

test("impersonation denial propagates without using the source for Search Console", async (t) => {
  t.after(() => setImpersonationTarget(undefined));
  setImpersonationTarget(target);
  const source = new OAuth2Client();
  t.mock.method(source, "getAccessToken", async () => ({ token: "source-token" }));
  const request = t.mock.method(source, "request", async () => {
    throw new Error("permission denied");
  });
  t.mock.method(GoogleAuth.prototype, "getClient", async () => source);
  const client = await createWebmastersClient();
  const auth = client.context._options.auth;
  assert.ok(auth instanceof Impersonated);
  await assert.rejects(auth.getRequestHeaders(), /permission denied/);
  assert.equal(request.mock.callCount(), 1);
});

test("CLI advertises the impersonation option", () => {
  const result = spawnSync(process.execPath, [
    "--import", "tsx", fileURLToPath(new URL("../src/index.ts", import.meta.url)), "--help",
  ], { encoding: "utf-8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--impersonate-service-account <email>/);
});
