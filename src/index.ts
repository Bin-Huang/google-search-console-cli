#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { setCredentialsPath, version } from "./auth.js";
import { registerSitesCommands } from "./commands/sites.js";
import { registerSitemapsCommands } from "./commands/sitemaps.js";
import { registerQueryCommands } from "./commands/query.js";
import { registerInspectCommands } from "./commands/inspect.js";

async function main() {
  const program = new Command();

  program
    .name("google-search-console-cli")
    .description("Google Search Console CLI for AI agents")
    .addHelpText("after", "\nDocs: https://github.com/Bin-Huang/google-search-console-cli")
    .version(version)
    .option(
      "--format <format>",
      "Output format",
      (value: string) => {
        if (!["json", "compact"].includes(value)) {
          throw new Error("Format must be 'json' or 'compact'.");
        }
        return value;
      },
      "json",
    )
    .option(
      "--credentials <path>",
      "Path to service account JSON key file",
    );

  program.exitOverride();
  program.configureOutput({
    writeErr: (str) =>
      process.stderr.write(JSON.stringify({ error: str.trim() }) + "\n"),
    writeOut: (str) => process.stdout.write(str),
  });

  program.hook("preAction", (thisCommand) => {
    const { credentials } = thisCommand.optsWithGlobals();
    if (credentials) setCredentialsPath(credentials);
  });

  registerQueryCommands(program);
  registerSitesCommands(program);
  registerSitemapsCommands(program);
  registerInspectCommands(program);

  // No args: show help and exit cleanly
  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }

  try {
    await program.parseAsync();
  } catch (err) {
    if (err instanceof CommanderError) {
      process.exit(err.exitCode);
    }
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(JSON.stringify({ error: message }) + "\n");
    process.exit(1);
  }
}

main();
