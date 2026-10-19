export function outputJson(data: unknown, format: string): void {
  const indent = format === "json" ? 2 : undefined;
  process.stdout.write(JSON.stringify(data ?? null, null, indent) + "\n");
}

interface ApiError extends Error {
  code?: number | string;
  details?: string;
  errors?: unknown;
}

// Add a next step to the auth errors that new users hit most often.
export function withCredentialsHint(message: string): string {
  // googleauth says this when no key file and no gcloud ADC are found.
  if (message.includes("Could not load the default credentials")) {
    return (
      "No credentials found. Provide a service account JSON key in one of these ways: " +
      "(1) pass --credentials <path>, " +
      "(2) set GOOGLE_APPLICATION_CREDENTIALS=<path>, " +
      "(3) save it as ~/.config/google-search-console-cli/credentials.json. " +
      "See https://github.com/Bin-Huang/google-search-console-cli#setup"
    );
  }
  // The token endpoint rejected the credentials: "invalid_grant" for an
  // expired gcloud login, "invalid_grant: ..." for a bad service account key.
  if (message.startsWith("invalid_grant")) {
    return (
      `${message.replace(/\.$/, "")}. Google rejected the credentials. ` +
      "With gcloud Application Default Credentials, the login expired or was revoked: " +
      "run gcloud auth application-default login again with the same flags. " +
      "With a service account key, the key or the service account may be deleted or disabled: " +
      "create a new key. " +
      "See https://github.com/Bin-Huang/google-search-console-cli#troubleshooting"
    );
  }
  return message;
}

export function errorJson(message: string, err?: unknown): never {
  const output: Record<string, unknown> = { error: withCredentialsHint(message) };
  if (err && typeof err === "object") {
    const apiErr = err as ApiError;
    if (apiErr.code != null) output.code = apiErr.code;
    if (apiErr.details) output.details = apiErr.details;
  }
  process.stderr.write(JSON.stringify(output) + "\n");
  process.exit(1);
}

export async function run(
  fn: () => Promise<unknown>,
  format: string,
): Promise<void> {
  try {
    const data = await fn();
    outputJson(data, format);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errorJson(message, err);
  }
}
