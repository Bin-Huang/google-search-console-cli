import fs from "node:fs";
import { Command } from "commander";
import { createSearchConsoleClient } from "../auth.js";
import { errorJson, outputJson } from "../utils.js";

function readLines(source: string | undefined): string[] {
  const text = source
    ? fs.readFileSync(source, "utf-8")
    : fs.readFileSync(0, "utf-8"); // stdin
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function registerInspectBatchCommands(program: Command): void {
  program
    .command("inspect-batch <siteUrl>")
    .description("Batch inspect multiple URLs' index status")
    .option("--file <path>", "File with URLs (one per line); reads stdin if omitted")
    .option("--language <code>", "Language code for messages (e.g. en-US)", "en-US")
    .action(async (siteUrl: string, opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;

      let urls: string[];
      try {
        urls = readLines(opts.file);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errorJson(`Failed to read URLs: ${message}`, err);
      }

      if (urls.length === 0) {
        errorJson("No URLs provided.");
      }

      const client = await createSearchConsoleClient();
      const results: unknown[] = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        process.stderr.write(`Inspecting ${i + 1}/${urls.length}: ${url}\n`);
        try {
          const res = await client.urlInspection.index.inspect({
            requestBody: {
              inspectionUrl: url,
              siteUrl,
              languageCode: opts.language,
            },
          });
          const result = { url, ...res.data };
          if (format === "compact") {
            process.stdout.write(JSON.stringify(result) + "\n");
          } else {
            results.push(result);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          const result = { url, error: message };
          if (format === "compact") {
            process.stdout.write(JSON.stringify(result) + "\n");
          } else {
            results.push(result);
          }
        }
      }

      if (format !== "compact") {
        outputJson(results, format);
      }
    });
}
