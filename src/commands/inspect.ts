import { Command } from "commander";
import { createSearchConsoleClient } from "../auth.js";
import { run } from "../utils.js";

export function registerInspectCommands(program: Command): void {
  program
    .command("inspect <siteUrl> <inspectionUrl>")
    .description("Inspect a URL's index status")
    .option("--language <code>", "Language code for messages (e.g. en-US)", "en-US")
    .action(async (siteUrl: string, inspectionUrl: string, opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createSearchConsoleClient();
        const res = await client.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl,
            siteUrl,
            languageCode: opts.language,
          },
        });
        return res.data;
      }, format);
    });
}
