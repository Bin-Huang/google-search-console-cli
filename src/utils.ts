export function outputJson(data: unknown, format: string): void {
  const indent = format === "json" ? 2 : undefined;
  process.stdout.write(JSON.stringify(data ?? null, null, indent) + "\n");
}

interface ApiError extends Error {
  code?: number | string;
  details?: string;
  errors?: unknown;
}

// googleauth says "Could not load the default credentials" when no key file
// and no gcloud ADC are found. Tell the user where the CLI looks for a key.
export function withCredentialsHint(message: string): string {
  if (!message.includes("Could not load the default credentials")) return message;
  return (
    "No credentials found. Provide a service account JSON key in one of these ways: " +
    "(1) pass --credentials <path>, " +
    "(2) set GOOGLE_APPLICATION_CREDENTIALS=<path>, " +
    "(3) save it as ~/.config/google-search-console-cli/credentials.json. " +
    "See https://github.com/Bin-Huang/google-search-console-cli#setup"
  );
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
